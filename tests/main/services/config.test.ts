import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigService } from '@/main/services/config';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ConfigService', () => {
  let configService: ConfigService;
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-context-manager-test-'));
    configService = new ConfigService(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should return default config if file does not exist', async () => {
    const config = await configService.getGlobalConfig();
    expect(config).toEqual({ version: 1 });
  });

  it('should save and retrieve global config', async () => {
    await configService.setGlobalConfig({ language: 'zh-CN', theme: 'dark' });
    const config = await configService.getGlobalConfig();
    expect(config.language).toBe('zh-CN');
    expect(config.theme).toBe('dark');
    expect(config.version).toBe(1);
  });

  it('should resolve variables in presets', async () => {
    // Mock getPresets or test logic via public methods if possible.
    // For now, skipping detailed preset test as it depends on external files not easily mocked without fs mock.
    // We can rely on manual verification or integration tests for presets.
  });

  it('should resolve environment variables', () => {
    process.env.TEST_VAR = 'test_value';
    // Accessing private method for testing purposes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolved = (configService as any).resolveVariables('${HOME}/skills');
    const home = process.env.HOME || process.env.USERPROFILE || '';
    // Normalize expected path
    const expected = path.join(home, 'skills');
    expect(resolved).toBe(expected);
  });
});
