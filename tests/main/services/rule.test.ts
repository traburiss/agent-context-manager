
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuleService } from '../../../src/main/services/rule';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

vi.mock('fs-extra');
vi.mock('js-yaml');

describe('RuleService', () => {
  let ruleService: RuleService;
  const mockBaseDir = '/mock/base/dir';

  beforeEach(() => {
    ruleService = new RuleService(mockBaseDir);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return empty list if rules file does not exist', async () => {
      (fs.pathExists as any).mockResolvedValue(false);
      const result = await ruleService.list();
      expect(result).toEqual([]);
    });

    it('should return rules list if file exists', async () => {
      (fs.pathExists as any).mockResolvedValue(true);
      (fs.readFile as any).mockResolvedValue('parsed yaml content');
      (yaml.load as any).mockReturnValue([{ id: 'rule1', name: 'Rule 1' }]);

      const result = await ruleService.list();
      expect(result).toEqual([{ id: 'rule1', name: 'Rule 1' }]);
    });
  });

  describe('create', () => {
      it('should create a new rule', async () => {
          (fs.pathExists as any).mockResolvedValue(true);
          (fs.readFile as any).mockResolvedValue('');
          (yaml.load as any).mockReturnValue([]);
          
          const newRule = { name: 'My Rule', localPath: '/path/to/rule.md', linkedPlatforms: [] };
          const result = await ruleService.create(newRule);

          expect(result.id).toBe('my-rule');
          expect(fs.writeFile).toHaveBeenCalled(); // Saves config
          expect(fs.ensureFile).toHaveBeenCalledWith('/path/to/rule.md'); // Creates content file
      });
  });

  describe('getContent', () => {
      it('should return content if rule and file exist', async () => {
          (fs.pathExists as any).mockResolvedValue(true); // For list check (called by get)
          (fs.readFile as any).mockResolvedValueOnce('yaml'); // For list
          (yaml.load as any).mockReturnValue([{ id: 'rule1', localPath: '/path/to/rule.md' }]);
          
          (fs.pathExists as any).mockResolvedValueOnce(true); // For file content check
          (fs.readFile as any).mockResolvedValueOnce('rule content'); // For file content

          const content = await ruleService.getContent('rule1');
          expect(content).toBe('rule content');
      });
  });
});
