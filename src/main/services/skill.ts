import fs from 'fs-extra';
import path from 'path';
import { Skill } from '../../shared/types';
import { ConfigService } from './config';

export class SkillService {
    constructor(private configService: ConfigService) {}

    async listAll(): Promise<Skill[]> {
        const userConfig = await this.configService.getUserConfig();
        const skills: Skill[] = [];

        for (const repo of userConfig.skills) {
             const repoSkills = await this.scanSkills(repo.localPath, repo.id);
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
                        
                        // Relative path from repo root, e.g. "my-skills/coding" -> "coding"
                        // But wait, the repoPath is root. So relative is "coding".
                        const relativePath = path.relative(rootDir, fullPath);
                        const id = relativePath.replace(/\\/g, '/'); // Normalize slashes

                        skills.push({
                            id: `${repoId}/${id}`, // Unique ID composition
                            repoId: repoId,
                            name: entry.name,
                            localPath: fullPath,
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
        // Try to find description in YAML frontmatter/header
        // Or just normal text? Design doc said:
        /*
        function extractDescription(skillMd: string): string {
          const match = skillMd.match(/description:\s*(.+)/i);
          return match ? match[1].trim() : '';
        }
        */
       // Improve regex to capture multi-line or be more robust if needed, but start simple
       const match = content.match(/^description:\s*(.+)$/m);
       if (match) {
           return match[1].trim();
       }
       
       // Fallback: First line of content?
       return '';
    }
}
