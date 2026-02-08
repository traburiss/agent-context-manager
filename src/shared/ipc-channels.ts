
import { SystemConfig, UserConfig, Platform, PlatformPreset, Rule, SkillRepo, UpdateCheckResult, Skill } from './types';

export enum IpcChannels {
  // Config
  GetSystemConfig = 'config:get-system',
  SetSystemConfig = 'config:set-system',
  GetUserConfig = 'config:get-user',
  SetUserConfig = 'config:set-user',
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
  DeleteRepo = 'git:delete', // Added

  // Skill
  ListSkills = 'skill:list', // Added

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
  UndeployRules = 'rule:undeploy', // Added
  
  // App
  OpenExternal = 'app:open-external',
  SelectDirectory = 'app:select-directory',
  SelectFile = 'app:select-file',
  GetAppVersion = 'app:get-version' // Added
}

// Request/Response Types
export interface IpcApi {
  // Config
  [IpcChannels.GetSystemConfig]: () => Promise<SystemConfig>;
  [IpcChannels.SetSystemConfig]: (config: Partial<SystemConfig>) => Promise<void>;
  [IpcChannels.GetUserConfig]: () => Promise<UserConfig>;
  [IpcChannels.SetUserConfig]: (config: Partial<UserConfig>) => Promise<void>;
  [IpcChannels.GetPresets]: () => Promise<PlatformPreset[]>;

  // Platform
  [IpcChannels.ListPlatforms]: () => Promise<Platform[]>;
  [IpcChannels.GetPlatform]: (id: string) => Promise<Platform | null>;
  [IpcChannels.CreatePlatform]: (platform: Omit<Platform, 'id'>) => Promise<Platform>;
  [IpcChannels.UpdatePlatform]: (platform: Platform) => Promise<Platform>;
  [IpcChannels.DeletePlatform]: (id: string) => Promise<void>;

  // Git
  [IpcChannels.CheckGitInstalled]: () => Promise<boolean>;
  [IpcChannels.CloneRepo]: (url: string, targetDir?: string) => Promise<SkillRepo>; // Updated return type
  [IpcChannels.PullRepo]: (repoId: string) => Promise<void>; // Updated arg
  [IpcChannels.NormalizeUrl]: (url: string) => Promise<string>;
  [IpcChannels.CheckUpdates]: (repoId: string) => Promise<UpdateCheckResult>; // Updated arg
  [IpcChannels.DeleteRepo]: (repoId: string) => Promise<void>; // Added

  // Skill
  [IpcChannels.ListSkills]: () => Promise<Skill[]>; // Added

  // Symlink
  [IpcChannels.CreateSymlink]: (target: string, path: string) => Promise<void>;
  [IpcChannels.RemoveSymlink]: (path: string) => Promise<void>;
  [IpcChannels.CheckSymlink]: (path: string) => Promise<boolean>;

  // Rule
  [IpcChannels.ListRules]: () => Promise<Rule[]>;
  [IpcChannels.GetRule]: (id: string) => Promise<Rule | null>;
  [IpcChannels.CreateRule]: (rule: Omit<Rule, 'id' | 'createdAt' | 'localPath' | 'linkedPlatforms'> & { localPath?: string; linkedPlatforms?: string[] }, content?: string) => Promise<Rule>; // Updated args
  [IpcChannels.UpdateRule]: (rule: Rule) => Promise<Rule>;
  [IpcChannels.DeleteRule]: (id: string) => Promise<void>;
  [IpcChannels.GetRuleContent]: (id: string) => Promise<string>;
  [IpcChannels.SetRuleContent]: (id: string, content: string) => Promise<void>;

  // Rule Deploy
  [IpcChannels.DeployRules]: (ruleId: string, platformId: string) => Promise<void>; // Updated args
  [IpcChannels.UndeployRules]: (ruleId: string, platformId: string) => Promise<void>; // Added
  
  // App
  [IpcChannels.OpenExternal]: (url: string) => Promise<void>;
  [IpcChannels.SelectDirectory]: () => Promise<string | null>;
  [IpcChannels.SelectFile]: (filterName?: string, extensions?: string[]) => Promise<string | null>;
  [IpcChannels.GetAppVersion]: () => Promise<string>; // Added
}
