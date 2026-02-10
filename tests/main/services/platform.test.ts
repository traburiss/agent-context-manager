import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PlatformService } from '@/main/services/platform';
import { Platform, UserConfig, SystemConfig } from '@/shared/types';
import { ConfigService } from '@/main/services/config'; // Import type only effectively

// Mock Electron just in case imports trigger it, though we don't expect to use it.
vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/mock-app-data'
  }
}));

describe('PlatformService', () => {
    let platformService: PlatformService;
    let mockConfigService: any; // Using any to easily mock methods
    let memoryAgents: Platform[] = [];

    beforeEach(() => {
        memoryAgents = [];
        
        // Manual mock of ConfigService
        mockConfigService = {
            getUserConfig: vi.fn().mockImplementation(async () => {
                return { 
                    agents: memoryAgents,
                    skills: [],
                    rules: []
                } as UserConfig;
            }),
            setUserConfig: vi.fn().mockImplementation(async (patch: Partial<UserConfig>) => {
                if (patch.agents) {
                    memoryAgents = patch.agents;
                }
            }),
            resolveVariables: vi.fn().mockImplementation((val: string) => {
                return val.replace('${HOME}', '/mock/home');
            }),
            getPresets: vi.fn().mockResolvedValue([
                { name: 'MockPreset', skillsDir: '${HOME}/skills', rulesFile: '${HOME}/rules.md' }
            ])
        };

        // Inject mock
        platformService = new PlatformService(mockConfigService as ConfigService);
    });

    it('should list empty platforms initially', async () => {
        const platforms = await platformService.list();
        expect(platforms).toEqual([]);
    });

    it('should create a platform and retrieve it', async () => {
        const newPlatform = {
            name: 'Test Agent',
            skillsDir: '${HOME}/test/skills',
            rulesFile: '${HOME}/test/rules.md',
            enabled: true,
             linkedSkills: [],
             linkedRules: []
        };

        const created = await platformService.create(newPlatform);
        
        expect(created.id).toBe('test-agent');
        expect(created.skillsDir).toBe('/mock/home/test/skills'); // Should be resolved
        
        const list = await platformService.list();
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe('test-agent');
        
        // Verify setUserConfig was called with raw paths (not checking here but logic implies it)
    });

    it('should update a platform', async () => {
        const p = await platformService.create({
            name: 'Update Test',
            skillsDir: 'dir1',
            rulesFile: 'file1',
            enabled: true
        });

        const updated = await platformService.update({
            ...p,
            name: 'Updated Name'
        });

        expect(updated.name).toBe('Updated Name');
        
        const check = await platformService.get(p.id);
        expect(check?.name).toBe('Updated Name');
    });

    it('should delete a platform', async () => {
        const p = await platformService.create({
            name: 'Delete Test',
            skillsDir: 'dir1',
            rulesFile: 'file1',
            enabled: true
        });

        await platformService.delete(p.id);
        
        const list = await platformService.list();
        expect(list).toHaveLength(0);
    });

    it('should get presets', async () => {
        const presets = await platformService.getPresets();
        expect(presets).toHaveLength(1);
        expect(presets[0].name).toBe('MockPreset');
    });
});
