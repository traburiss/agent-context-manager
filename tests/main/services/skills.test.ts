import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitService } from '../../../src/main/services/git';
import { SkillService } from '../../../src/main/services/skill';
import { ConfigService } from '../../../src/main/services/config';
import { UserConfig, SystemConfig, SkillRepo } from '../../../src/shared/types';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { PlatformService } from '../../../src/main/services/platform';
import { SymlinkService } from '../../../src/main/services/symlink';

// Mock simple-git
const mockGit = {
    clone: vi.fn(),
    pull: vi.fn(),
    fetch: vi.fn(),
    status: vi.fn().mockResolvedValue({ behind: 0, ahead: 0 }),
    version: vi.fn().mockResolvedValue({ major: 2, minor: 0, patch: 0 })
};

vi.mock('simple-git', () => {
    return {
        default: () => mockGit
    };
});

// Mock Electron
vi.mock('electron', () => ({
    app: { getPath: () => '/mock/appData' }
}));

describe('Skill & Git Services', () => {
    let gitService: GitService;
    let skillService: SkillService;
    let mockConfigService: any;
    let memorySkills: SkillRepo[] = [];
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acm-test-skills-'));
        memorySkills = [];

        mockConfigService = {
            getUserConfig: vi.fn().mockResolvedValue({
                agents: [],
                skills: memorySkills,
                rules: []
            } as UserConfig),
            getSystemConfig: vi.fn().mockResolvedValue({
                baseDir: tempDir
            } as SystemConfig),
            setUserConfig: vi.fn().mockImplementation(async (patch: Partial<UserConfig>) => {
                if (patch.skills) {
                    memorySkills = patch.skills;
                }
            }),
            resolveVariables: vi.fn((p) => p)
        };

        const mockPlatformService = {
            list: vi.fn().mockResolvedValue([]),
            get: vi.fn(),
            update: vi.fn()
        };

        const mockSymlinkService = {
            createSymlink: vi.fn(),
            removeSymlink: vi.fn()
        };

        gitService = new GitService(mockConfigService as ConfigService);
        skillService = new SkillService(
            mockConfigService as ConfigService,
            mockPlatformService as unknown as PlatformService,
            mockSymlinkService as unknown as SymlinkService
        );
    });

    afterEach(async () => {
        await fs.remove(tempDir);
        vi.clearAllMocks();
    });

    describe('GitService', () => {
        it('should normalize git urls', () => {
            expect(gitService.normalizeGitUrl('user/repo')).toBe('https://github.com/user/repo.git');
            expect(gitService.normalizeGitUrl('https://example.com/foo.git')).toBe('https://example.com/foo.git');
        });

        it('should clone a repo and update config', async () => {
            const url = 'user/repo';
            await gitService.clone(url);

            expect(mockGit.clone).toHaveBeenCalled();
            expect(memorySkills).toHaveLength(1);
            expect(memorySkills[0].id).toBe('repo');
            expect(memorySkills[0].url).toBe('https://github.com/user/repo.git');
            // Check paths
            // expect(memorySkills[0].localPath).toContain(tempDir);
        });

        it('should delete a repo', async () => {
             // Setup initial state
             memorySkills.push({
                 id: 'repo',
                 name: 'repo',
                 url: 'http://foo',
                 localPath: path.join(tempDir, 'skills', 'repo'),
                 lastUpdated: ''
             });
             
             // Create fake dir
             await fs.ensureDir(memorySkills[0].localPath);

             await gitService.delete('repo');
             
             expect(memorySkills).toHaveLength(0);
             expect(await fs.pathExists(path.join(tempDir, 'skills', 'repo'))).toBe(false);
        });
    });

    describe('SkillService', () => {
        it('should scan skills correctly', async () => {
            const repoPath = path.join(tempDir, 'test-repo');
            await fs.ensureDir(repoPath);

            // Create a skill
            const skillDir = path.join(repoPath, 'my-skill');
            await fs.ensureDir(skillDir);
            await fs.writeFile(path.join(skillDir, 'SKILL.MD'), 'description: A cool skill');

            // Create a non-skill dir
            await fs.ensureDir(path.join(repoPath, 'not-a-skill'));

            const skills = await skillService.scanSkills(repoPath, 'test-repo');

            expect(skills).toHaveLength(1);
            expect(skills[0].id).toBe('test-repo/my-skill');
            expect(skills[0].name).toBe('my-skill');
            expect(skills[0].description).toBe('A cool skill');
        });

        it('should handle nested skills', async () => {
            const repoPath = path.join(tempDir, 'nested-repo');
            await fs.ensureDir(repoPath);

             // Create a nested skill
             const skillDir = path.join(repoPath, 'category', 'nested-skill');
             await fs.ensureDir(skillDir);
             await fs.writeFile(path.join(skillDir, 'SKILL.MD'), 'description: Nested');
 
             const skills = await skillService.scanSkills(repoPath, 'nested-repo');
 
             expect(skills).toHaveLength(1);
             expect(skills[0].id).toBe('nested-repo/category/nested-skill');
        });
    });
});
