import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from './config';
import { SkillRepo, UpdateCheckResult } from '../../shared/types';

const execFileAsync = promisify(execFile);

export class GitService {
    private git: SimpleGit | null = null;
    private gitPath: string | null = null;

    constructor(private configService: ConfigService) {}

    private async findGitPath(): Promise<string | null> {
        if (this.gitPath) {
            return this.gitPath;
        }

        try {
            if (process.platform === 'win32') {
                const { stdout } = await execFileAsync('where.exe', ['git']);
                const paths = stdout.trim().split('\n');
                if (paths.length > 0) {
                    let gitPath = paths[0].replace(/\r/g, '').trim();
                     if (gitPath.includes('\\cmd\\git.exe')) {
                        gitPath = gitPath.replace('\\cmd\\git.exe', '\\bin\\git.exe');
                    }
                    this.gitPath = gitPath;
                    return this.gitPath;
                }
            } else {
                const { stdout } = await execFileAsync('which', ['git']);
                this.gitPath = stdout.trim();
                return this.gitPath;
            }
        } catch (error) {
            console.error('Failed to find git path:', error);
            return null;
        }

        return null;
    }

    private async getGit(baseDir?: string): Promise<SimpleGit> {
        const gitPath = await this.findGitPath();
        const options: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
            maxConcurrentProcesses: 6,
            unsafe: { allowUnsafeCustomBinary: true }
        };

        if (gitPath) {
            options.binary = gitPath;
            options.config = ['core.longpaths=true'];
        }

        if (baseDir) {
            options.baseDir = baseDir;
        }

        // We create a new instance if baseDir is provided, otherwise we might reuse a shared one?
        // Actually simple-git instances are lightweight. Let's create fresh ones to be safe with baseDir.
        // But for checkGitInstalled we need a generic one.
        
        return simpleGit(options);
    }

    async checkGitInstalled(): Promise<boolean> {
        try {
            const git = await this.getGit();
            await git.version();
            return true;
        } catch (error) {
            console.error('Git check failed:', error);
            return false;
        }
    }

    normalizeGitUrl(url: string): string {
        if (url.startsWith('https://') || url.startsWith('git@') || url.startsWith('ssh://')) {
          return url;
        }
        // Helper for GitHub shorthand "user/repo"
        if (/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+$/.test(url)) {
            return `https://github.com/${url}.git`;
        }
        return url;
    }

    private extractRepoName(url: string): string {
        // Extract owner/repo from URL
        // Supported formats:
        // https://github.com/owner/repo.git
        // git@github.com:owner/repo.git
        
        let path = url;
        if (url.startsWith('https://')) {
            path = url.replace('https://', '');
        } else if (url.startsWith('git@')) {
            path = url.replace('git@', '').replace(':', '/');
        } else if (url.startsWith('ssh://')) {
             path = url.replace('ssh://', '');
        }

        // Remove .git
        if (path.endsWith('.git')) {
            path = path.slice(0, -4);
        }

        // Split by / and get last two parts
        const parts = path.split('/');
        if (parts.length >= 2) {
            const owner = parts[parts.length - 2];
            const repo = parts[parts.length - 1];
            return `${owner}_${repo}`; // Use underscore to match folder naming convention preference or just keeping it flat
        }

        // Fallback
        return parts[parts.length - 1];
    }

    async clone(url: string, _targetDir?: string): Promise<SkillRepo> { // eslint-disable-line @typescript-eslint/no-unused-vars
        const normalizedUrl = this.normalizeGitUrl(url);
        const repoName = this.extractRepoName(normalizedUrl);
        
        const userConfig = await this.configService.getUserConfig();
        const systemConfig = await this.configService.getSystemConfig();

        if (userConfig.skills.some(s => s.url === normalizedUrl || s.id === repoName)) {
             throw new Error(`Repository ${repoName} or URL already exists`);
        }
        
        if (!systemConfig.baseDir) {
            throw new Error('System base directory not set');
        }

        const skillsRootDir = path.join(systemConfig.baseDir, 'skills');
        const localPath = path.join(skillsRootDir, repoName);

        await fs.ensureDir(skillsRootDir);

        if (await fs.pathExists(localPath)) {
            throw new Error(`Target directory ${localPath} already exists`);
        }

        const git = await this.getGit();
        
        // Log handler
        git.outputHandler((command, stdout, stderr) => {
            stdout.on('data', (data) => {
                const message = data.toString();
                 // Send to all windows
                 import('electron').then(({ BrowserWindow }) => {
                    BrowserWindow.getAllWindows().forEach(win => {
                        win.webContents.send('git:log', message);
                    });
                 });
            });
            stderr.on('data', (data) => {
                const message = data.toString();
                 import('electron').then(({ BrowserWindow }) => {
                    BrowserWindow.getAllWindows().forEach(win => {
                        win.webContents.send('git:log', message);
                    });
                 });
            });
        });

        await git.clone(normalizedUrl, localPath, ['--depth', '1', '--progress', '--verbose']);

        const newRepo: SkillRepo = {
            id: repoName,
            name: repoName,
            url: normalizedUrl,
            localPath: localPath, 
            lastUpdated: new Date().toISOString()
        };

        userConfig.skills.push(newRepo);
        await this.configService.setUserConfig({ skills: userConfig.skills });

        return newRepo;
    }

    async pull(id: string): Promise<void> {
        const userConfig = await this.configService.getUserConfig();
        const repo = userConfig.skills.find(s => s.id === id);
        
        if (!repo) {
             throw new Error(`Repository with ID ${id} not found`);
        }

        if (!await fs.pathExists(repo.localPath)) {
            throw new Error(`Repository directory ${repo.localPath} does not exist`);
        }

        const git = await this.getGit(repo.localPath);
        await git.pull();

        // Update timestamp
        repo.lastUpdated = new Date().toISOString();
        repo.updateStatus = 'up-to-date'; // Assume up to date after pull
        repo.behindCount = 0;
        
        // Update in config
        const index = userConfig.skills.findIndex(s => s.id === id);
        if (index !== -1) {
            userConfig.skills[index] = repo;
            await this.configService.setUserConfig({ skills: userConfig.skills });
        }
    }

    async delete(id: string): Promise<void> {
        const userConfig = await this.configService.getUserConfig();
        const repo = userConfig.skills.find(s => s.id === id);
        
        if (!repo) {
            throw new Error(`Repository with ID ${id} not found`);
        }

        // Remove from disk
        if (await fs.pathExists(repo.localPath)) {
            await fs.remove(repo.localPath);
        }

        // Remove from config
        userConfig.skills = userConfig.skills.filter(s => s.id !== id);
        await this.configService.setUserConfig({ skills: userConfig.skills });
    }


    // ... (rest of methods)

    async checkUpdates(id: string): Promise<UpdateCheckResult> {
        // ...
        // fix error: any
        try {
            // ... (implementation)
            const userConfig = await this.configService.getUserConfig();
            const repo = userConfig.skills.find(s => s.id === id);
            
            if (!repo) {
                 throw new Error(`Repository with ID ${id} not found`);
            }
    
            if (!await fs.pathExists(repo.localPath)) {
                 throw new Error(`Repository directory ${repo.localPath} does not exist`);
            }

            const git = await this.getGit(repo.localPath);
            await git.fetch();
            const status = await git.status();
            
            const result: UpdateCheckResult = {
                repoId: id,
                hasUpdates: status.behind > 0,
                behindCount: status.behind,
                aheadCount: status.ahead
            };

            repo.updateStatus = status.behind > 0 ? 'behind' : 'up-to-date';
            repo.behindCount = status.behind;
            
             const index = userConfig.skills.findIndex(s => s.id === id);
            if (index !== -1) {
                userConfig.skills[index] = repo;
                await this.configService.setUserConfig({ skills: userConfig.skills });
            }

            return result;
        } catch (error: unknown) {
             const errorMessage = error instanceof Error ? error.message : String(error);
             const userConfig = await this.configService.getUserConfig();
             const index = userConfig.skills.findIndex(s => s.id === id);
             if (index !== -1) {
                userConfig.skills[index].updateStatus = 'error';
                userConfig.skills[index].checkError = errorMessage;
                await this.configService.setUserConfig({ skills: userConfig.skills });
            }
            
            return {
                repoId: id,
                hasUpdates: false,
                behindCount: 0,
                aheadCount: 0,
                error: errorMessage
            };
        }
    }
}
