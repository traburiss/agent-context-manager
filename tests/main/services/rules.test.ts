import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RuleService } from '../../../src/main/services/rule';
import { RuleDeployService } from '../../../src/main/services/rule-deploy';
import { ConfigService } from '../../../src/main/services/config';
import { PlatformService } from '../../../src/main/services/platform';
import { Rule, Platform, UserConfig, SystemConfig } from '../../../src/shared/types';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock ConfigService
const mockConfigService = {
    getUserConfig: vi.fn(),
    getSystemConfig: vi.fn(),
    setUserConfig: vi.fn()
};

// Mock PlatformService
const mockPlatformService = {
    get: vi.fn(),
    update: vi.fn()
};

// Mock fs via temp dirs in actual execution (preferred for file ops)

describe('Rule Services', () => {
    let ruleService: RuleService;
    let ruleDeployService: RuleDeployService;
    let tempDir: string;
    let memoryRules: Rule[] = [];

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acm-test-rules-'));
        memoryRules = [];

        mockConfigService.getUserConfig.mockResolvedValue({
            agents: [],
            skills: [],
            rules: memoryRules
        } as UserConfig);

        mockConfigService.getSystemConfig.mockResolvedValue({
            baseDir: tempDir
        } as SystemConfig);

        mockConfigService.setUserConfig.mockImplementation(async (patch: Partial<UserConfig>) => {
            if (patch.rules) {
                memoryRules = patch.rules;
            }
        });

        ruleService = new RuleService(mockConfigService as any);
        ruleDeployService = new RuleDeployService(mockPlatformService as any, ruleService);
    });

    afterEach(async () => {
        await fs.remove(tempDir);
        vi.clearAllMocks();
    });

    describe('RuleService', () => {
        it('should create a rule', async () => {
            const rule = await ruleService.create({ name: 'Test Rule' }, '# Content');
            
            expect(rule.id).toBe('test-rule');
            expect(memoryRules).toHaveLength(1);
            expect(await fs.pathExists(rule.localPath)).toBe(true);
            expect(await fs.readFile(rule.localPath, 'utf-8')).toBe('# Content');
        });

        it('should delete a rule', async () => {
            const rule = await ruleService.create({ name: 'Delete Me' });
            await ruleService.delete(rule.id);
            
            expect(memoryRules).toHaveLength(0);
            expect(await fs.pathExists(rule.localPath)).toBe(false);
        });

        it('should updata rule content', async () => {
             const rule = await ruleService.create({ name: 'Update Me' }, 'Old');
             await ruleService.setContent(rule.id, 'New');
             
             expect(await fs.readFile(rule.localPath, 'utf-8')).toBe('New');
        });
    });

    describe('RuleDeployService', () => {
        it('should deploy rule content with markers', async () => {
            // Setup
            const rule = await ruleService.create({ name: 'Global Rule' }, 'Rule Content');
            const platformRulesFile = path.join(tempDir, 'platform-rules.md');
            
            mockPlatformService.get.mockResolvedValue({
                id: 'plat1',
                name: 'Plat 1',
                rulesFile: platformRulesFile,
                linkedRules: []
            } as any);

            // Execute
            await ruleDeployService.deploy(rule.id, 'plat1');

            // Verify
            const content = await fs.readFile(platformRulesFile, 'utf-8');
            expect(content).toContain('<!-- SKILLS_MANAGER_RULE_START:global-rule -->');
            expect(content).toContain('Rule Content');
            expect(content).toContain('<!-- SKILLS_MANAGER_RULE_END:global-rule -->');
            
            // Should update links
            expect(mockPlatformService.update).toHaveBeenCalled();
            // Verify Rule linkedPlatforms updated?
            const updatedRule = await ruleService.get(rule.id);
            expect(updatedRule?.linkedPlatforms).toContain('plat1');
        });

        it('should undeploy rule content', async () => {
            // Setup with pre-existing content
            const rulesFile = path.join(tempDir, 'platform-rules-undeploy.md');
            const initialContent = `
Existing
<!-- SKILLS_MANAGER_RULE_START:target -->
To Remove
<!-- SKILLS_MANAGER_RULE_END:target -->
Keep
`;
            await fs.writeFile(rulesFile, initialContent);

            mockPlatformService.get.mockResolvedValue({
                id: 'plat1',
                rulesFile: rulesFile,
                linkedRules: ['target']
            } as any);

            // We need the rule to exist in service to update its links
            await ruleService.create({ name: 'Target' }); // id: target

            // Execute
            await ruleDeployService.undeploy('target', 'plat1');

            // Verify
            const content = await fs.readFile(rulesFile, 'utf-8');
            expect(content).not.toContain('To Remove');
            expect(content).toContain('Existing');
            expect(content).toContain('Keep');
        });
    });
});
