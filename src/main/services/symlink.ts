
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class SymlinkService {
  
  async createSymlink(target: string, linkPath: string): Promise<void> {
    const parentDir = path.dirname(linkPath);
    await fs.ensureDir(parentDir);

    if (await fs.pathExists(linkPath)) {
        // If it's already a symlink, check if it points to the right place
        const stats = await fs.lstat(linkPath);
        if (stats.isSymbolicLink()) {
             const currentTarget = await fs.readlink(linkPath);
             if (path.resolve(currentTarget) === path.resolve(target)) {
                 return; // Already correct
             }
             // Remove incorrect symlink
             await fs.remove(linkPath); 
        } else {
             throw new Error(`Path ${linkPath} exists and is not a symbolic link`);
        }
    }

    try {
      const type = os.platform() === 'win32' ? 'junction' : 'dir';
      await fs.ensureSymlink(target, linkPath, type);
    } catch (error) {
       // Check for admin rights error (heuristic)
       if ((error as any).code === 'EPERM') {
           throw new Error('Permission denied. Administrator rights might be required to create symbolic links.', { cause: error });
       }
       throw error;
    }
  }

  async removeSymlink(linkPath: string): Promise<void> {
      if (!await fs.pathExists(linkPath)) {
          return;
      }
      
      const stats = await fs.lstat(linkPath);
      if (stats.isSymbolicLink()) {
          await fs.remove(linkPath);
      } else {
           throw new Error(`Path ${linkPath} is not a symbolic link`);
      }
  }

  async checkSymlink(linkPath: string): Promise<boolean> {
      if (!await fs.pathExists(linkPath)) {
          return false;
      }
      const stats = await fs.lstat(linkPath);
      return stats.isSymbolicLink();
  }
}
