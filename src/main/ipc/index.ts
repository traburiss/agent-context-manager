
import { ipcMain, shell, dialog, app } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels.js';
import { ConfigService } from '../services/config.js';
import { PlatformService } from '../services/platform.js';
import { GitService } from '../services/git.js';
import { SymlinkService } from '../services/symlink.js';
import { RuleService } from '../services/rule.js';
import { RuleDeployService } from '../services/rule-deploy.js';
import { SkillService } from '../services/skill.js';

export function registerIpcHandlers(appDataPath: string) {
  const configService = new ConfigService(appDataPath);
  const platformService = new PlatformService(configService);
  const gitService = new GitService(configService);
  const symlinkService = new SymlinkService();
  const ruleService = new RuleService(configService);
  const ruleDeployService = new RuleDeployService(platformService, ruleService);
  const skillService = new SkillService(configService, platformService, symlinkService);

  // Helper to register handler with error handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handle = (channel: string, handler: (...args: any[]) => Promise<any>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMain.handle(channel, async (_event, ...args: any[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        console.error(`Error in IPC handler for ${channel}:`, error);
        throw error; // Re-throw to be caught by renderer
      }
    });
  };

  // Config
  handle(IpcChannels.GetSystemConfig, async () => configService.getSystemConfig());
  handle(IpcChannels.SetSystemConfig, async (config) => configService.setSystemConfig(config));
  handle(IpcChannels.GetUserConfig, async () => configService.getUserConfig());
  handle(IpcChannels.SetUserConfig, async (config) => configService.setUserConfig(config));
  handle(IpcChannels.GetPresets, async () => configService.getPresets());

  // Platform
  handle(IpcChannels.ListPlatforms, () => platformService.list());
  handle(IpcChannels.GetPlatform, (id) => platformService.get(id));
  handle(IpcChannels.CreatePlatform, (platform) => platformService.create(platform));
  handle(IpcChannels.UpdatePlatform, (platform) => platformService.update(platform));
  handle(IpcChannels.DeletePlatform, (id) => platformService.delete(id));
  handle(IpcChannels.OpenPlatformDir, (path) => platformService.openPath(path));
  handle(IpcChannels.OpenPlatformFile, (path) => platformService.openFileLocation(path));

  // Git
  handle(IpcChannels.CheckGitInstalled, () => gitService.checkGitInstalled());
  handle(IpcChannels.CloneRepo, (url, targetDir) => gitService.clone(url, targetDir));
  handle(IpcChannels.PullRepo, (repoId) => gitService.pull(repoId));
  handle(IpcChannels.NormalizeUrl, async (url) => gitService.normalizeGitUrl(url)); 
  handle(IpcChannels.CheckUpdates, (repoId) => gitService.checkUpdates(repoId));
  handle(IpcChannels.DeleteRepo, (repoId) => gitService.delete(repoId));

  // Skill
  handle(IpcChannels.ListSkills, () => skillService.listAll());
  handle(IpcChannels.LinkSkill, (skillId, platformId) => skillService.link(skillId, platformId));
  handle(IpcChannels.UnlinkSkill, (skillId, platformId) => skillService.unlink(skillId, platformId));

  // Symlink
  handle(IpcChannels.CreateSymlink, (target, path) => symlinkService.createSymlink(target, path));
  handle(IpcChannels.RemoveSymlink, (path) => symlinkService.removeSymlink(path));
  handle(IpcChannels.CheckSymlink, (path) => symlinkService.checkSymlink(path));

  // Rule
  handle(IpcChannels.ListRules, () => ruleService.list());
  handle(IpcChannels.GetRule, (id) => ruleService.get(id));
  handle(IpcChannels.CreateRule, (rule, content) => ruleService.create(rule, content));
  handle(IpcChannels.UpdateRule, (rule) => ruleService.update(rule));
  handle(IpcChannels.DeleteRule, (id) => ruleService.delete(id));
  handle(IpcChannels.GetRuleContent, (id) => ruleService.getContent(id));
  handle(IpcChannels.SetRuleContent, (id, content) => ruleService.setContent(id, content));

  // Rule Deploy
  handle(IpcChannels.DeployRules, (ruleId, platformId) => ruleDeployService.deploy(ruleId, platformId));
  handle(IpcChannels.UndeployRules, (ruleId, platformId) => ruleDeployService.undeploy(ruleId, platformId));

  // App
  handle(IpcChannels.OpenExternal, async (url) => {
    await shell.openExternal(url);
  });
  
  handle(IpcChannels.SelectDirectory, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths[0];
  });

  handle(IpcChannels.SelectFile, async (filterName, extensions) => {
    const filters = filterName && extensions ? [{ name: filterName, extensions }] : [];
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths[0];
  });

  handle(IpcChannels.GetAppVersion, async () => {
      return app.getVersion();
  });
}
