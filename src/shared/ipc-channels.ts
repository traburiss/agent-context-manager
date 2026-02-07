
import { GlobalConfig, Platform, PlatformPreset, Rule } from './types';

export enum IpcChannels {
  // Config
  GetGlobalConfig = 'config:get-global',
  SetGlobalConfig = 'config:set-global',
  GetPresets = 'config:get-presets',

  // Platform
  ListPlatforms = 'platform:list',
  GetPlatform = 'platform:get',
  CreatePlatform = 'platform:create',
  UpdatePlatform = 'platform:update',
  DeletePlatform = 'platform:delete',

  // Git
  CheckGitInstalled = 'git:check-installed',
  CloneRepo = 'git:clone',
  PullRepo = 'git:pull',
  NormalizeUrl = 'git:normalize-url',
  CheckUpdates = 'git:check-updates',

  // Symlink
  CreateSymlink = 'symlink:create',
  RemoveSymlink = 'symlink:remove',
  CheckSymlink = 'symlink:check',

  // Rule
  ListRules = 'rule:list',
  GetRule = 'rule:get',
  CreateRule = 'rule:create',
  UpdateRule = 'rule:update',
  DeleteRule = 'rule:delete',
  GetRuleContent = 'rule:get-content',
  SetRuleContent = 'rule:set-content',

  // Rule Deploy
  DeployRules = 'rule:deploy',
  
  // App
  OpenExternal = 'app:open-external',
  SelectDirectory = 'app:select-directory'
}

// Request/Response Types
export interface IpcApi {
  // Config
  [IpcChannels.GetGlobalConfig]: () => Promise<GlobalConfig>;
  [IpcChannels.SetGlobalConfig]: (config: Partial<GlobalConfig>) => Promise<void>;
  [IpcChannels.GetPresets]: () => Promise<PlatformPreset[]>;

  // Platform
  [IpcChannels.ListPlatforms]: () => Promise<Platform[]>;
  [IpcChannels.GetPlatform]: (id: string) => Promise<Platform | null>;
  [IpcChannels.CreatePlatform]: (platform: Omit<Platform, 'id'>) => Promise<Platform>;
  [IpcChannels.UpdatePlatform]: (platform: Platform) => Promise<Platform>;
  [IpcChannels.DeletePlatform]: (id: string) => Promise<void>;

  // Git
  [IpcChannels.CheckGitInstalled]: () => Promise<boolean>;
  [IpcChannels.CloneRepo]: (url: string, targetDir: string) => Promise<void>;
  [IpcChannels.PullRepo]: (targetDir: string) => Promise<void>;
  [IpcChannels.NormalizeUrl]: (url: string) => Promise<string>;
  [IpcChannels.CheckUpdates]: (targetDir: string) => Promise<boolean>;

  // Symlink
  [IpcChannels.CreateSymlink]: (target: string, path: string) => Promise<void>;
  [IpcChannels.RemoveSymlink]: (path: string) => Promise<void>;
  [IpcChannels.CheckSymlink]: (path: string) => Promise<boolean>;

  // Rule
  [IpcChannels.ListRules]: () => Promise<Rule[]>;
  [IpcChannels.GetRule]: (id: string) => Promise<Rule | null>;
  [IpcChannels.CreateRule]: (rule: Omit<Rule, 'id'>) => Promise<Rule>;
  [IpcChannels.UpdateRule]: (rule: Rule) => Promise<Rule>;
  [IpcChannels.DeleteRule]: (id: string) => Promise<void>;
  [IpcChannels.GetRuleContent]: (id: string) => Promise<string>;
  [IpcChannels.SetRuleContent]: (id: string, content: string) => Promise<void>;

  // Rule Deploy
  [IpcChannels.DeployRules]: (platformId: string) => Promise<void>;
  
  // App
  [IpcChannels.OpenExternal]: (url: string) => Promise<void>;
  [IpcChannels.SelectDirectory]: () => Promise<string | null>;
}
