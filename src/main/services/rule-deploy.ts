import fs from 'fs-extra';
import path from 'path';
import { PlatformService } from './platform';
import { RuleService } from './rule';

export class RuleDeployService {
    constructor(
        private platformService: PlatformService,
        private ruleService: RuleService
    ) { }

    async checkFileStatus(platformId: string, ruleId: string): Promise<{ status: 'linked' | 'conflict' | 'missing' | 'clean' }> {
        const platform = await this.platformService.get(platformId);
        if (!platform || !platform.rulesFile) {
            return { status: 'missing' };
        }
    
        if (!await fs.pathExists(platform.rulesFile)) {
            return { status: 'clean' };
        }

        const stats = await fs.lstat(platform.rulesFile);
        if (stats.isSymbolicLink()) {
            const target = await fs.readlink(platform.rulesFile);
            const rule = await this.ruleService.get(ruleId);
            if (rule && rule.localPath && path.resolve(target) === path.resolve(rule.localPath)) {
                return { status: 'linked' };
            }
            return { status: 'conflict' }; // Linked to something else
        }

        return { status: 'conflict' }; // Real file exists
    }

    // Renaming 'deploy' to 'link' in concept, but keeping method name compatible if possible, or usually we update Ipc calls.
    // The IPC is `rule:deploy`. I will keep the method name `deploy` to avoid renaming everything, but the logic is linking.
    async deploy(ruleId: string, platformId: string, mode: 'overwrite' | 'backup' = 'overwrite'): Promise<void> {
        const platform = await this.platformService.get(platformId);
        if (!platform) {
            throw new Error(`Platform with ID ${platformId} not found`);
        }

        const rule = await this.ruleService.get(ruleId);
        if (!rule || !rule.localPath) {
            throw new Error(`Rule with ID ${ruleId} invalid`);
        }

        const rulesFile = platform.rulesFile;
        if (!rulesFile) {
            throw new Error(`Platform ${platform.name} has no rulesFile configured`);
        }

        if (await fs.pathExists(rulesFile)) {
            const stats = await fs.lstat(rulesFile);
        
            // If it's already the correct link, do nothing
            if (stats.isSymbolicLink()) {
                const target = await fs.readlink(rulesFile);
                if (path.resolve(target) === path.resolve(rule.localPath)) {
                    return;
                }
            }

            if (mode === 'backup') {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFile = `${rulesFile}.bak_${timestamp}`;
                await fs.move(rulesFile, backupFile);
            } else if (mode === 'overwrite') {
                await fs.remove(rulesFile);
            } else {
                throw new Error(`File ${rulesFile} exists and mode is not overwrite/backup`);
            }
        }

        await fs.ensureDir(path.dirname(rulesFile));
        // symlinkType: 'junction' for Windows, 'file' or 'dir' (rule file is a file) -> 'file' (default) or 'junction' directory?
        // Rule is a FILE. So `fs.ensureSymlink(src, dest, 'file')`.
        // On Windows, require admin for file symlinks sometimes?
        // Start with default.
        try {
            await fs.ensureSymlink(rule.localPath, rulesFile);
        } catch (error) {
            // Fallback or error handling for permissions
            throw error;
        }

        // Update Rule linked platforms
        if (!rule.linkedPlatforms.includes(platformId)) {
            rule.linkedPlatforms.push(platformId);
            await this.ruleService.update(rule);
        }

        // Update Platform linked rules
        if (!platform.linkedRules) platform.linkedRules = [];
        if (!platform.linkedRules.includes(ruleId)) {
            platform.linkedRules.push(ruleId);
            await this.platformService.update(platform);
        }
    }

    async undeploy(ruleId: string, platformId: string): Promise<void> {
        const platform = await this.platformService.get(platformId);
        if (!platform) {
            throw new Error(`Platform with ID ${platformId} not found`);
        }

        const rulesFile = platform.rulesFile;
        if (!rulesFile || !await fs.pathExists(rulesFile)) {
            // Just clean up DB links if file is gone
        } else {
            const stats = await fs.lstat(rulesFile);
            if (stats.isSymbolicLink()) {
                // Only remove if it links to THIS rule?
                // Or just remove it if it's a link?
                // Safer to check target.
                const rule = await this.ruleService.get(ruleId);
                if (rule && rule.localPath) {
                    const target = await fs.readlink(rulesFile);
                    if (path.resolve(target) === path.resolve(rule.localPath)) {
                        await fs.remove(rulesFile);
                    }
                }
            }
        }

        // Update Rule linked platforms
        const rule = await this.ruleService.get(ruleId);
        if (rule) {
            rule.linkedPlatforms = rule.linkedPlatforms.filter(p => p !== platformId);
            await this.ruleService.update(rule);
        }

        // Update Platform linked rules
        if (platform.linkedRules) {
            platform.linkedRules = platform.linkedRules.filter(r => r !== ruleId);
            await this.platformService.update(platform);
        }
    }
}
