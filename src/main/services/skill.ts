import fs from 'fs-extra';
import path from 'path';
import { Skill } from '../../shared/types';
import { ConfigService } from './config';
import { PlatformService } from './platform';
import { SymlinkService } from './symlink';

export class SkillService {
    constructor(
        private configService: ConfigService,
        private platformService: PlatformService,
        private symlinkService: SymlinkService
    ) {}

    async listAll(): Promise<Skill[]> {
        const userConfig = await this.configService.getUserConfig();
        const skills: Skill[] = [];

        // Get all platforms to check linkage
        const platforms = await this.platformService.list();

        for (const repo of userConfig.skills) {
             const repoSkills = await this.scanSkills(repo.localPath, repo.id);
             
             // Populate linkedPlatforms
             repoSkills.forEach(skill => {
                 skill.linkedPlatforms = platforms
                    .filter(p => p.linkedSkills?.includes(skill.id))
                    .map(p => p.id);
             });

             skills.push(...repoSkills);
        }

        return skills;
    }
    
    async scanSkills(repoPath: string, repoId: string): Promise<Skill[]> {
        const skills: Skill[] = [];

        if (!await fs.pathExists(repoPath)) {
            return [];
        }

        // Limit depth to avoid deep traversal
        await this.scanDir(repoPath, repoPath, repoId, skills, 0);
        return skills;
    }

    private async scanDir(currentDir: string, rootDir: string, repoId: string, skills: Skill[], depth: number) {
        if (depth > 3) return;

        try {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const fullPath = path.join(currentDir, entry.name);
                    const skillFile = path.join(fullPath, 'SKILL.MD');

                    if (await fs.pathExists(skillFile)) {
                        const content = await fs.readFile(skillFile, 'utf-8');
                        
                        // Relative path from repo root
                        const relativePath = path.relative(rootDir, fullPath);
                        const id = relativePath.replace(/\\/g, '/'); // Normalize slashes

                        skills.push({
                            id: `${repoId}/${id}`, // Unique ID composition
                            repoId: repoId,
                            name: entry.name,
                            localPath: fullPath, // Absolute path
                            description: this.extractDescription(content),
                            linkedPlatforms: []
                        });
                    } else {
                        // Continue deeper
                        await this.scanDir(fullPath, rootDir, repoId, skills, depth + 1);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${currentDir}:`, error);
        }
    }

    private extractDescription(content: string): string {
       const match = content.match(/^description:\s*(.+)$/m);
       if (match) {
           return match[1].trim();
       }
       return '';
    }

    async get(id: string): Promise<Skill | null> {
        const skills = await this.listAll();
        return skills.find(s => s.id === id) || null;
    }

    async link(skillId: string, platformId: string): Promise<void> {
        const skill = await this.get(skillId);
        if (!skill) {
            throw new Error(`Skill with ID ${skillId} not found`);
        }

        const platform = await this.platformService.get(platformId);
        if (!platform) {
            throw new Error(`Platform with ID ${platformId} not found`);
        }

        const userConfig = await this.configService.getUserConfig();
        const repo = userConfig.skills.find(r => r.id === skill.repoId);

        // 1. Determine Link Path
        let linkName = skill.name;
        const defaultLinkPath = path.join(platform.skillsDir, linkName);

        // Check for conflict
        if (await fs.pathExists(defaultLinkPath)) {
            const stats = await fs.lstat(defaultLinkPath);
            let isSame = false;
            
            if (stats.isSymbolicLink()) {
                const currentTarget = await fs.readlink(defaultLinkPath);
                if (path.resolve(currentTarget) === path.resolve(skill.localPath)) {
                    isSame = true;
                }
            }

            if (!isSame) {
                // Name conflict! Auto prepend org name
                const orgName = this.extractOrgName(repo?.url || '');
                if (orgName) {
                    linkName = `${orgName}-${skill.name}`;
                }
            }
        }

        const finalLinkPath = path.join(platform.skillsDir, linkName);
        await this.symlinkService.createSymlink(skill.localPath, finalLinkPath);

        // 2. Update Configuration
        if (!platform.linkedSkills) {
            platform.linkedSkills = [];
        }
        if (!platform.linkedSkills.includes(skillId)) {
            platform.linkedSkills.push(skillId);
            await this.platformService.update(platform);
        }
    }

    async unlink(skillId: string, platformId: string): Promise<void> {
        const skill = await this.get(skillId);
        if (!skill) {
            // If skill is not found (e.g. repo deleted), we should still try to unlink from platform config and remove symlink if possible.
            // But we need the name to remove the symlink.
            // If we can't find the skill, we might have to rely on just removing from config,
            // or we need to guess the symlink name.
            // Let's throw for now, or maybe check config.
             console.warn(`Skill ${skillId} not found during unlink. Proceeding to remove from config.`);
        }

        const platform = await this.platformService.get(platformId);
        if (!platform) {
            throw new Error(`Platform with ID ${platformId} not found`);
        }

        // 1. Update Configuration
        if (platform.linkedSkills && platform.linkedSkills.includes(skillId)) {
            platform.linkedSkills = platform.linkedSkills.filter(id => id !== skillId);
            await this.platformService.update(platform);
        }

        // 2. Remove Symlink
        if (skill) {
            // Check both possible names: default and prefixed
            const userConfig = await this.configService.getUserConfig();
            const repo = userConfig.skills.find(r => r.id === skill.repoId);
            const orgName = this.extractOrgName(repo?.url || '');
            
            const possibleNames = [skill.name];
            if (orgName) {
                possibleNames.push(`${orgName}-${skill.name}`);
            }

            for (const name of possibleNames) {
                const linkPath = path.join(platform.skillsDir, name);
                if (await fs.pathExists(linkPath)) {
                    const stats = await fs.lstat(linkPath);
                    if (stats.isSymbolicLink()) {
                        const target = await fs.readlink(linkPath);
                        if (path.resolve(target) === path.resolve(skill.localPath)) {
                            await this.symlinkService.removeSymlink(linkPath);
                        }
                    }
                }
            }
        }
    }

    private extractOrgName(url: string): string {
        if (!url) return '';
        
        // Handle git@github.com:org/repo.git
        const sshMatch = url.match(/[:/]([^/]+)\/[^/]+(?:\.git)?$/);
        if (sshMatch) {
            return sshMatch[1];
        }

        // Handle https://github.com/org/repo.git
        try {
            const parsed = new URL(url);
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return parts[0];
            }
        } catch {
            // Fallback for non-standard URLs
            const parts = url.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return parts[parts.length - 2];
            }
        }

        return '';
    }
}

