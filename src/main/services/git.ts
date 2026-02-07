
import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';

export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async checkGitInstalled(): Promise<boolean> {
    try {
      await this.git.version();
      return true;
    } catch {
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

    await this.git.clone(url, targetDir);
  }

  async pull(targetDir: string): Promise<void> {
    if (!await fs.pathExists(targetDir)) {
      throw new Error(`Target directory ${targetDir} does not exist`);
    }
    
    const gitInstance = simpleGit(targetDir);
    await gitInstance.pull();
  }

  async checkUpdates(targetDir: string): Promise<boolean> {
      if (!await fs.pathExists(targetDir)) {
          throw new Error(`Target directory ${targetDir} does not exist`);
      }

      const gitInstance = simpleGit(targetDir);
      await gitInstance.fetch();
      const status = await gitInstance.status();
      return status.behind > 0;
  }
}
