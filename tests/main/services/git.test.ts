
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from '../../../src/main/services/git';
import fs from 'fs-extra';
// Mock simple-git
const mockSimpleGit = {
  version: vi.fn(),
  clone: vi.fn(),
  pull: vi.fn(),
  fetch: vi.fn(),
  status: vi.fn(),
};

vi.mock('simple-git', () => {
    return {
        default: vi.fn(() => mockSimpleGit),
        SimpleGit: vi.fn(),
        SimpleGitOptions: vi.fn()
    };
});

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    pathExists: vi.fn(),
    remove: vi.fn(), 
  },
}));

describe('GitService', () => {
  let gitService: GitService;

  beforeEach(() => {
    gitService = new GitService();
    vi.clearAllMocks();
  });

  describe('checkGitInstalled', () => {
    it('should return true if git is installed', async () => {
      mockSimpleGit.version.mockResolvedValue({ major: 2, minor: 30, patch: 0 });
      const result = await gitService.checkGitInstalled();
      expect(result).toBe(true);
    });

    it('should return false if git is not installed', async () => {
      mockSimpleGit.version.mockRejectedValue(new Error('Git not found'));
      const result = await gitService.checkGitInstalled();
      expect(result).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize git url', () => {
      expect(gitService.normalizeUrl('https://github.com/user/repo')).toBe('https://github.com/user/repo.git');
      expect(gitService.normalizeUrl('https://github.com/user/repo.git')).toBe('https://github.com/user/repo.git');
      expect(gitService.normalizeUrl('https://github.com/user/repo/')).toBe('https://github.com/user/repo.git');
    });
  });

  describe('clone', () => {
      it('should clone repository if target directory does not exist', async () => {
          (fs.pathExists as any).mockResolvedValue(false);
          await gitService.clone('https://github.com/user/repo.git', '/path/to/target');
          expect(fs.ensureDir).toHaveBeenCalledWith('/path/to');
          expect(mockSimpleGit.clone).toHaveBeenCalledWith('https://github.com/user/repo.git', '/path/to/target');
      });

      it('should throw error if target directory already exists', async () => {
          (fs.pathExists as any).mockResolvedValue(true);
          await expect(gitService.clone('https://github.com/user/repo.git', '/path/to/target')).rejects.toThrow('Target directory /path/to/target already exists');
      });
  });

  describe('pull', () => {
      it('should pull changes if directory exists', async () => {
           (fs.pathExists as any).mockResolvedValue(true);
           await gitService.pull('/path/to/target');
           expect(mockSimpleGit.pull).toHaveBeenCalled();
      });

       it('should throw error if directory does not exist', async () => {
           (fs.pathExists as any).mockResolvedValue(false);
           await expect(gitService.pull('/path/to/target')).rejects.toThrow('Target directory /path/to/target does not exist');
      });
  });

  describe('checkUpdates', () => {
        it('should return true if behind', async () => {
             (fs.pathExists as any).mockResolvedValue(true);
             mockSimpleGit.status.mockResolvedValue({ behind: 1 });
             const result = await gitService.checkUpdates('/path/to/target');
             expect(mockSimpleGit.fetch).toHaveBeenCalled();
             expect(result).toBe(true);
        });

        it('should return false if not behind', async () => {
             (fs.pathExists as any).mockResolvedValue(true);
             mockSimpleGit.status.mockResolvedValue({ behind: 0 });
             const result = await gitService.checkUpdates('/path/to/target');
             expect(mockSimpleGit.fetch).toHaveBeenCalled();
             expect(result).toBe(false);
        });
  });
});
