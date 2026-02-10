import { ipcRenderer, contextBridge } from 'electron';
import { IpcApi, IpcChannels } from '../shared/ipc-channels';

const api: IpcApi = {
  // Config
  // Config
  [IpcChannels.GetSystemConfig]: () => ipcRenderer.invoke(IpcChannels.GetSystemConfig),
  [IpcChannels.SetSystemConfig]: (config) => ipcRenderer.invoke(IpcChannels.SetSystemConfig, config),
  [IpcChannels.GetUserConfig]: () => ipcRenderer.invoke(IpcChannels.GetUserConfig),
  [IpcChannels.SetUserConfig]: (config) => ipcRenderer.invoke(IpcChannels.SetUserConfig, config),
  [IpcChannels.GetPresets]: () => ipcRenderer.invoke(IpcChannels.GetPresets),


  // Events
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  off: (channel: string, callback: (...args: any[]) => void) => ipcRenderer.removeListener(channel, callback),

  // Platform
  // Platform
  [IpcChannels.ListPlatforms]: () => ipcRenderer.invoke(IpcChannels.ListPlatforms),
  [IpcChannels.GetPlatform]: (id: string) => ipcRenderer.invoke(IpcChannels.GetPlatform, id),
  [IpcChannels.CreatePlatform]: (platform) => ipcRenderer.invoke(IpcChannels.CreatePlatform, platform),
  [IpcChannels.UpdatePlatform]: (platform) => ipcRenderer.invoke(IpcChannels.UpdatePlatform, platform),
  [IpcChannels.DeletePlatform]: (id) => ipcRenderer.invoke(IpcChannels.DeletePlatform, id),
  [IpcChannels.OpenPlatformDir]: (path) => ipcRenderer.invoke(IpcChannels.OpenPlatformDir, path),
  [IpcChannels.OpenPlatformFile]: (path) => ipcRenderer.invoke(IpcChannels.OpenPlatformFile, path),

  // Git
  [IpcChannels.CheckGitInstalled]: () => ipcRenderer.invoke(IpcChannels.CheckGitInstalled),
  [IpcChannels.CloneRepo]: (url, targetDir) => ipcRenderer.invoke(IpcChannels.CloneRepo, url, targetDir),
  [IpcChannels.PullRepo]: (repoId) => ipcRenderer.invoke(IpcChannels.PullRepo, repoId),
  [IpcChannels.NormalizeUrl]: (url) => ipcRenderer.invoke(IpcChannels.NormalizeUrl, url),
  [IpcChannels.CheckUpdates]: (repoId) => ipcRenderer.invoke(IpcChannels.CheckUpdates, repoId),
  [IpcChannels.DeleteRepo]: (repoId) => ipcRenderer.invoke(IpcChannels.DeleteRepo, repoId),

  // Skill
  [IpcChannels.ListSkills]: () => ipcRenderer.invoke(IpcChannels.ListSkills),
  [IpcChannels.LinkSkill]: (skillId, platformId) => ipcRenderer.invoke(IpcChannels.LinkSkill, skillId, platformId),
  [IpcChannels.UnlinkSkill]: (skillId, platformId) => ipcRenderer.invoke(IpcChannels.UnlinkSkill, skillId, platformId),

  // Symlink
  [IpcChannels.CreateSymlink]: (target, path) => ipcRenderer.invoke(IpcChannels.CreateSymlink, target, path),
  [IpcChannels.RemoveSymlink]: (path) => ipcRenderer.invoke(IpcChannels.RemoveSymlink, path),
  [IpcChannels.CheckSymlink]: (path) => ipcRenderer.invoke(IpcChannels.CheckSymlink, path),

  // Rule
  [IpcChannels.ListRules]: () => ipcRenderer.invoke(IpcChannels.ListRules),
  [IpcChannels.GetRule]: (id) => ipcRenderer.invoke(IpcChannels.GetRule, id),
  [IpcChannels.CreateRule]: (rule, content) => ipcRenderer.invoke(IpcChannels.CreateRule, rule, content),
  [IpcChannels.UpdateRule]: (rule) => ipcRenderer.invoke(IpcChannels.UpdateRule, rule),
  [IpcChannels.DeleteRule]: (id) => ipcRenderer.invoke(IpcChannels.DeleteRule, id),
  [IpcChannels.GetRuleContent]: (id) => ipcRenderer.invoke(IpcChannels.GetRuleContent, id),
  [IpcChannels.SetRuleContent]: (id, content) => ipcRenderer.invoke(IpcChannels.SetRuleContent, id, content),

  // Rule Deploy
  [IpcChannels.DeployRules]: (ruleId, platformId, mode) => ipcRenderer.invoke(IpcChannels.DeployRules, ruleId, platformId, mode),
  [IpcChannels.UndeployRules]: (ruleId, platformId) => ipcRenderer.invoke(IpcChannels.UndeployRules, ruleId, platformId),
  [IpcChannels.CheckFileStatus]: (platformId, ruleId) => ipcRenderer.invoke(IpcChannels.CheckFileStatus, platformId, ruleId),

  // App
  [IpcChannels.OpenExternal]: (url) => ipcRenderer.invoke(IpcChannels.OpenExternal, url),
  [IpcChannels.SelectDirectory]: () => ipcRenderer.invoke(IpcChannels.SelectDirectory),
  [IpcChannels.SelectFile]: (filterName, extensions) => ipcRenderer.invoke(IpcChannels.SelectFile, filterName, extensions),
  [IpcChannels.GetAppVersion]: () => ipcRenderer.invoke(IpcChannels.GetAppVersion)
};

contextBridge.exposeInMainWorld('api', api);
