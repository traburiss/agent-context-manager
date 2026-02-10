
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SymlinkService } from '../../../src/main/services/symlink';
import fs from 'fs-extra';
import os from 'os';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    pathExists: vi.fn(),
    lstat: vi.fn(),
    readlink: vi.fn(),
    remove: vi.fn(),
    ensureSymlink: vi.fn(),
  },
}));

// Mock os.platform to simulate Windows/Linux
vi.mock('os', () => ({
    default: {
        platform: vi.fn()
    }
}));


describe('SymlinkService', () => {
  let symlinkService: SymlinkService;

  beforeEach(() => {
    symlinkService = new SymlinkService();
    vi.clearAllMocks();
    (os.platform as any).mockReturnValue('win32'); // Default to win32
  });

  describe('createSymlink', () => {
    it('should create a symlink (junction on Windows) if it does not exist', async () => {
      (fs.pathExists as any).mockResolvedValue(false);
      
      await symlinkService.createSymlink('/target/dir', '/link/path');

      expect(fs.ensureDir).toHaveBeenCalledWith('/link');
      expect(fs.ensureSymlink).toHaveBeenCalledWith('/target/dir', '/link/path', 'junction');
    });

    it('should create a dir symlink on non-Windows', async () => {
        (os.platform as any).mockReturnValue('linux');
        (fs.pathExists as any).mockResolvedValue(false);

        await symlinkService.createSymlink('/target/dir', '/link/path');

        expect(fs.ensureSymlink).toHaveBeenCalledWith('/target/dir', '/link/path', 'dir');
    });

    it('should do nothing if symlink already exists and points to correct target', async () => {
      (fs.pathExists as any).mockResolvedValue(true);
      (fs.lstat as any).mockResolvedValue({ isSymbolicLink: () => true });
      (fs.readlink as any).mockResolvedValue('/target/dir');

      await symlinkService.createSymlink('/target/dir', '/link/path');
      
      expect(fs.ensureSymlink).not.toHaveBeenCalled();
    });

     it('should replace symlink if it points to incorrect target', async () => {
      (fs.pathExists as any).mockResolvedValue(true);
      (fs.lstat as any).mockResolvedValue({ isSymbolicLink: () => true });
      (fs.readlink as any).mockResolvedValue('/old/target');

      await symlinkService.createSymlink('/target/dir', '/link/path');
      
      expect(fs.remove).toHaveBeenCalledWith('/link/path');
      expect(fs.ensureSymlink).toHaveBeenCalledWith('/target/dir', '/link/path', 'junction');
    });

    it('should throw error if path exists and is not a symlink', async () => {
       (fs.pathExists as any).mockResolvedValue(true);
       (fs.lstat as any).mockResolvedValue({ isSymbolicLink: () => false });
       
       await expect(symlinkService.createSymlink('/target/dir', '/link/path')).rejects.toThrow('Path /link/path exists and is not a symbolic link');
    });
  });

  describe('removeSymlink', () => {
      it('should remove symlink if it exists', async () => {
          (fs.pathExists as any).mockResolvedValue(true);
          (fs.lstat as any).mockResolvedValue({ isSymbolicLink: () => true });

          await symlinkService.removeSymlink('/link/path');
          expect(fs.remove).toHaveBeenCalledWith('/link/path');
      });

      it('should do nothing if path does not exist', async () => {
          (fs.pathExists as any).mockResolvedValue(false);
          await symlinkService.removeSymlink('/link/path');
          expect(fs.remove).not.toHaveBeenCalled();
      });

      it('should throw error if path is not a symlink', async () => {
          (fs.pathExists as any).mockResolvedValue(true);
          (fs.lstat as any).mockResolvedValue({ isSymbolicLink: () => false });
           await expect(symlinkService.removeSymlink('/link/path')).rejects.toThrow('Path /link/path is not a symbolic link');
      });
  });

  describe('checkSymlink', () => {
      it('should return true if connected and is symlink', async () => {
        (fs.pathExists as any).mockResolvedValue(true);
        (fs.lstat as any).mockResolvedValue({ isSymbolicLink: () => true });
        const result = await symlinkService.checkSymlink('/link/path');
        expect(result).toBe(true);
      });
      
       it('should return false if does not exist', async () => {
        (fs.pathExists as any).mockResolvedValue(false);
        const result = await symlinkService.checkSymlink('/link/path');
        expect(result).toBe(false);
      });
  });
});
