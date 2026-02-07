
import { ipcMain, shell, dialog } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels';
import { ConfigService } from '../services/config';
import { PlatformService } from '../services/platform';
import { GitService } from '../services/git';
import { SymlinkService } from '../services/symlink';
import { RuleService } from '../services/rule';
import { RuleDeployService } from '../services/rule-deploy';

export function registerIpcHandlers(baseDir: string) {
  const configService = new ConfigService(baseDir);
  const platformService = new PlatformService(baseDir);
  const gitService = new GitService();
  const symlinkService = new SymlinkService();
  const ruleService = new RuleService(baseDir);
  const ruleDeployService = new RuleDeployService(platformService, ruleService);

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
  handle(IpcChannels.GetGlobalConfig, () => configService.getGlobalConfig());
  handle(IpcChannels.SetGlobalConfig, (config) => configService.setGlobalConfig(config));
  handle(IpcChannels.GetPresets, () => configService.getPresets());

  // Platform
  handle(IpcChannels.ListPlatforms, () => platformService.list());
  handle(IpcChannels.GetPlatform, (id) => platformService.get(id));
  handle(IpcChannels.CreatePlatform, (platform) => platformService.create(platform));
  handle(IpcChannels.UpdatePlatform, (platform) => platformService.update(platform));
  handle(IpcChannels.DeletePlatform, (id) => platformService.delete(id));

  // Git
  handle(IpcChannels.CheckGitInstalled, () => gitService.checkGitInstalled());
  handle(IpcChannels.CloneRepo, (url, targetDir) => gitService.clone(url, targetDir));
  handle(IpcChannels.PullRepo, (targetDir) => gitService.pull(targetDir));
  handle(IpcChannels.NormalizeUrl, async (url) => gitService.normalizeUrl(url)); // normalizeUrl is sync but IPC is async, acceptable
  handle(IpcChannels.CheckUpdates, (targetDir) => gitService.checkUpdates(targetDir));

  // Symlink
  handle(IpcChannels.CreateSymlink, (target, path) => symlinkService.createSymlink(target, path));
  handle(IpcChannels.RemoveSymlink, (path) => symlinkService.removeSymlink(path));
  handle(IpcChannels.CheckSymlink, (path) => symlinkService.checkSymlink(path));

  // Rule
  handle(IpcChannels.ListRules, () => ruleService.list());
  handle(IpcChannels.GetRule, (id) => ruleService.get(id));
  handle(IpcChannels.CreateRule, (rule) => ruleService.create(rule));
  handle(IpcChannels.UpdateRule, (rule) => ruleService.update(rule));
  handle(IpcChannels.DeleteRule, (id) => ruleService.delete(id));
  handle(IpcChannels.GetRuleContent, (id) => ruleService.getContent(id));
  handle(IpcChannels.SetRuleContent, (id, content) => ruleService.setContent(id, content));

  // Rule Deploy
  handle(IpcChannels.DeployRules, (platformId) => ruleDeployService.deploy(platformId));

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
}
