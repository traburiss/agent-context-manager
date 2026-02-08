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

  // Platform
  [IpcChannels.ListPlatforms]: () => ipcRenderer.invoke(IpcChannels.ListPlatforms),
  [IpcChannels.GetPlatform]: (id) => ipcRenderer.invoke(IpcChannels.GetPlatform, id),
  [IpcChannels.CreatePlatform]: (platform) => ipcRenderer.invoke(IpcChannels.CreatePlatform, platform),
  [IpcChannels.UpdatePlatform]: (platform) => ipcRenderer.invoke(IpcChannels.UpdatePlatform, platform),
  [IpcChannels.DeletePlatform]: (id) => ipcRenderer.invoke(IpcChannels.DeletePlatform, id),

  // Git
  [IpcChannels.CheckGitInstalled]: () => ipcRenderer.invoke(IpcChannels.CheckGitInstalled),
  [IpcChannels.CloneRepo]: (url, targetDir) => ipcRenderer.invoke(IpcChannels.CloneRepo, url, targetDir),
  [IpcChannels.PullRepo]: (targetDir) => ipcRenderer.invoke(IpcChannels.PullRepo, targetDir),
  [IpcChannels.NormalizeUrl]: (url) => ipcRenderer.invoke(IpcChannels.NormalizeUrl, url),
  [IpcChannels.CheckUpdates]: (targetDir) => ipcRenderer.invoke(IpcChannels.CheckUpdates, targetDir),

  // Symlink
  [IpcChannels.CreateSymlink]: (target, path) => ipcRenderer.invoke(IpcChannels.CreateSymlink, target, path),
  [IpcChannels.RemoveSymlink]: (path) => ipcRenderer.invoke(IpcChannels.RemoveSymlink, path),
  [IpcChannels.CheckSymlink]: (path) => ipcRenderer.invoke(IpcChannels.CheckSymlink, path),

  // Rule
  [IpcChannels.ListRules]: () => ipcRenderer.invoke(IpcChannels.ListRules),
  [IpcChannels.GetRule]: (id) => ipcRenderer.invoke(IpcChannels.GetRule, id),
  [IpcChannels.CreateRule]: (rule) => ipcRenderer.invoke(IpcChannels.CreateRule, rule),
  [IpcChannels.UpdateRule]: (rule) => ipcRenderer.invoke(IpcChannels.UpdateRule, rule),
  [IpcChannels.DeleteRule]: (id) => ipcRenderer.invoke(IpcChannels.DeleteRule, id),
  [IpcChannels.GetRuleContent]: (id) => ipcRenderer.invoke(IpcChannels.GetRuleContent, id),
  [IpcChannels.SetRuleContent]: (id, content) => ipcRenderer.invoke(IpcChannels.SetRuleContent, id, content),

  // Rule Deploy
  [IpcChannels.DeployRules]: (platformId) => ipcRenderer.invoke(IpcChannels.DeployRules, platformId),

  // App
  [IpcChannels.OpenExternal]: (url) => ipcRenderer.invoke(IpcChannels.OpenExternal, url),
  [IpcChannels.SelectDirectory]: () => ipcRenderer.invoke(IpcChannels.SelectDirectory),
  [IpcChannels.SelectFile]: (filterName, extensions) => ipcRenderer.invoke(IpcChannels.SelectFile, filterName, extensions)
};

contextBridge.exposeInMainWorld('api', api);
