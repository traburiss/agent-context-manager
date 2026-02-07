import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlatformService } from '@/main/services/platform';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Platform } from '@/shared/types';

describe('PlatformService', () => {
  let platformService: PlatformService;
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-context-manager-platform-test-'));
    platformService = new PlatformService(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create and list platforms', async () => {
    const platformData: Omit<Platform, 'id'> = {
      name: 'Test Platform',
      skillsDir: '${HOME}/skills',
      rulesFile: '${HOME}/rules.md',
      enabled: true,
      linkedSkills: [],
      linkedRules: []
    };

    const created = await platformService.create(platformData);
    expect(created.id).toBe('test-platform');
    expect(created.name).toBe('Test Platform');

    const list = await platformService.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('test-platform');
    // List should return resolved paths
    expect(list[0].skillsDir).not.toContain('${HOME}');
  });

  it('should get platform by id with resolved paths', async () => {
    const platformData: Omit<Platform, 'id'> = {
      name: 'My Agent',
      skillsDir: '${HOME}/skills',
      rulesFile: '${HOME}/rules.md',
      enabled: true,
      linkedSkills: [],
      linkedRules: []
    };

    const created = await platformService.create(platformData);
    const fetched = await platformService.get(created.id);
    
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('My Agent');
    expect(fetched?.skillsDir).not.toContain('${HOME}');
  });

  it('should update platform', async () => {
    const created = await platformService.create({
      name: 'Update Me',
      skillsDir: '/tmp/1',
      rulesFile: '/tmp/1.md',
      enabled: true,
      linkedSkills: [],
      linkedRules: []
    });

    const updated = { ...created, enabled: false, name: 'Updated' };
    await platformService.update(updated);

    const fetched = await platformService.get(created.id);
    expect(fetched?.enabled).toBe(false);
    expect(fetched?.name).toBe('Updated');
  });

  it('should delete platform', async () => {
    const created = await platformService.create({
      name: 'Delete Me',
      skillsDir: '/tmp/1',
      rulesFile: '/tmp/1.md',
      enabled: true,
      linkedSkills: [],
      linkedRules: []
    });

    await platformService.delete(created.id);
    const fetched = await platformService.get(created.id);
    expect(fetched).toBeNull();
  });
});
