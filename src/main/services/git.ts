
import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class GitService {
    private git: SimpleGit | null = null;
    private gitPath: string | null = null;

    constructor() {
        // Git 实例将在首次使用时延迟初始化
    }

    private async findGitPath(): Promise<string | null> {
        if (this.gitPath) {
            return this.gitPath;
        }

        try {
            // Windows: 使用 where 命令
            if (process.platform === 'win32') {
                const { stdout } = await execFileAsync('where.exe', ['git']);
                const paths = stdout.trim().split('\n');
                if (paths.length > 0) {
                    // 清理路径：只移除 \r 和多余空格，保留正常路径字符
                    let gitPath = paths[0].replace(/\r/g, '').trim();
                    
                    // 如果找到的是 cmd/git.exe，尝试使用 bin/git.exe
                    if (gitPath.includes('\\cmd\\git.exe')) {
                        gitPath = gitPath.replace('\\cmd\\git.exe', '\\bin\\git.exe');
                    }
                    
                    this.gitPath = gitPath;
                    console.log('Found git at:', this.gitPath);
                    return this.gitPath;
                }
            } else {
                // Unix/Linux/Mac: 使用 which 命令
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

    private async getGit(): Promise<SimpleGit> {
        if (this.git) {
            return this.git;
        }

        const gitPath = await this.findGitPath();
        if (gitPath) {
            console.log('Initializing simple-git with binary:', gitPath);
            this.git = simpleGit({
                binary: gitPath,
                maxConcurrentProcesses: 6,
                config: [
                    'core.longpaths=true'
                ],
                unsafe: {
                    allowUnsafeCustomBinary: true
                }
            });
        } else {
            // 回退到默认配置
            console.log('Initializing simple-git with default config');
            this.git = simpleGit();
        }

        return this.git;
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

    normalizeUrl(url: string): string {
        // Basic normalization: remove trailing slash, ensure .git extension
        let normalized = url.trim().replace(/\/$/, '');
        if (!normalized.endsWith('.git')) {
            normalized += '.git';
        }
        return normalized;
    }

    async clone(url: string, targetDir: string): Promise<void> {
        const parentDir = path.dirname(targetDir);
        await fs.ensureDir(parentDir);

        if (await fs.pathExists(targetDir)) {
            throw new Error(`Target directory ${targetDir} already exists`);
        }

        const git = await this.getGit();
        await git.clone(url, targetDir);
    }

    async pull(targetDir: string): Promise<void> {
        if (!await fs.pathExists(targetDir)) {
            throw new Error(`Target directory ${targetDir} does not exist`);
        }

        const gitPath = await this.findGitPath();
        const gitInstance = gitPath
            ? simpleGit({ baseDir: targetDir, binary: gitPath, unsafe: { allowUnsafeCustomBinary: true } })
            : simpleGit(targetDir);
        await gitInstance.pull();
    }

    async checkUpdates(targetDir: string): Promise<boolean> {
        if (!await fs.pathExists(targetDir)) {
            throw new Error(`Target directory ${targetDir} does not exist`);
        }

        const gitPath = await this.findGitPath();
        const gitInstance = gitPath
            ? simpleGit({ baseDir: targetDir, binary: gitPath, unsafe: { allowUnsafeCustomBinary: true } })
            : simpleGit(targetDir);
        await gitInstance.fetch();
        const status = await gitInstance.status();
        return status.behind > 0;
    }
}
