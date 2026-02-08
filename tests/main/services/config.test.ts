import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '@/main/services/config';
import { SystemConfig } from '@/shared/types';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

describe('ConfigService', () => {
  let configService: ConfigService;
  let appDataDir: string;
  let userBaseDir: string;

  beforeEach(async () => {
    // Create temp directories
    appDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acm-test-appdata-'));
    userBaseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acm-test-basedir-'));
    
    // Initialize service with specific AppData path
    configService = new ConfigService(appDataDir);
  });

  afterEach(async () => {
    // Cleanup
    await fs.remove(appDataDir);
    await fs.remove(userBaseDir);
    vi.clearAllMocks();
  });

  describe('System Config', () => {
    it('should initialize with default system config', async () => {
      const config = await configService.loadSystemConfig();
      expect(config.version).toBe(1);
      expect(config.language).toBe('zh-CN');
    });

    it('should persist system config changes', async () => {
      await configService.setSystemConfig({ theme: 'dark' });
      
      // Wait for debounce (mock time or sleep)
      await new Promise(resolve => setTimeout(resolve, 600));

      const content = await fs.readFile(path.join(appDataDir, 'config.yaml'), 'utf-8');
      const savedConfig = yaml.load(content) as SystemConfig;
      expect(savedConfig.theme).toBe('dark');
      // Note: js-yaml used in implementation, but here we check file existence or load via service to verify
      // Let's use service to verify reload
      const newService = new ConfigService(appDataDir);
      const loaded = await newService.loadSystemConfig();
      expect(loaded.theme).toBe('dark');
    });
  });

  describe('User Config', () => {
    it('should not allow setting user config without baseDir', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await configService.setUserConfig({ agents: [] });
      expect(consoleSpy).toHaveBeenCalledWith('Cannot set user config: Base Dir not set');
    });

    it('should load and save user config when baseDir is set', async () => {
      // 1. Set baseDir in system config
      await configService.setSystemConfig({ baseDir: userBaseDir });
      
      // 2. Set User Config
      const mockAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        enabled: true,
        platform: 'vscode',
        skills: [],
        rules: [],
        linkedSkills: [],
        linkedRules: [],
        skillsDir: '',
        rulesFile: ''
      };

      await configService.setUserConfig({ agents: [mockAgent] });

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // 3. Verify persistence
      const agentsPath = path.join(userBaseDir, 'config', 'ai-agent.yaml');
      expect(await fs.pathExists(agentsPath)).toBe(true);
      
      // 4. Verify reload
      const newService = new ConfigService(appDataDir);
      await newService.initialize(); // Should load system config -> load user config
      const userConfig = await newService.getUserConfig();
      expect(userConfig.agents).toHaveLength(1);
      expect(userConfig.agents[0].id).toBe('test-agent');
    });
  });

  describe('Variable Resolution', () => {
    it('should resolve environment variables', () => {
      process.env.TEST_VAR = 'test_value';
      // Access private method via any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolved = (configService as any).resolveVariables('${HOME}/skills');
      const home = process.env.HOME || process.env.USERPROFILE || '';
      expect(resolved).toContain(home); // Basic check
    });
  });
});
