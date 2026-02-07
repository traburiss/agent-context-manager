
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuleDeployService } from '../../../src/main/services/rule-deploy';
import { PlatformService } from '../../../src/main/services/platform';
import { RuleService } from '../../../src/main/services/rule';
import fs from 'fs-extra';

vi.mock('fs-extra');

describe('RuleDeployService', () => {
  let ruleDeployService: RuleDeployService;
  let mockPlatformService: any;
  let mockRuleService: any;

  beforeEach(() => {
    mockPlatformService = {
      get: vi.fn(),
    } as any;
    mockRuleService = {
      getContent: vi.fn(),
    } as any;

    ruleDeployService = new RuleDeployService(mockPlatformService, mockRuleService);
    vi.clearAllMocks();
  });

  describe('deploy', () => {
    it('should correctly merge and deploy rules', async () => {
      mockPlatformService.get.mockResolvedValue({
        id: 'p1',
        rulesFile: '/path/to/platform/rules.md',
        linkedRules: ['r1', 'r2']
      });

      mockRuleService.getContent.mockImplementation((id: string) => {
        if (id === 'r1') return Promise.resolve('Content 1');
        if (id === 'r2') return Promise.resolve('Content 2');
        return Promise.resolve('');
      });

      await ruleDeployService.deploy('p1');

      expect(fs.ensureFile).toHaveBeenCalledWith('/path/to/platform/rules.md');
      expect(fs.writeFile).toHaveBeenCalledWith('/path/to/platform/rules.md', 'Content 1\n\nContent 2');
    });

    it('should clear rules file if no linked rules', async () => {
         mockPlatformService.get.mockResolvedValue({
            id: 'p1',
            rulesFile: '/path/to/platform/rules.md',
            linkedRules: []
          });

          await ruleDeployService.deploy('p1');
          expect(fs.writeFile).toHaveBeenCalledWith('/path/to/platform/rules.md', '');
    });
  });
});
