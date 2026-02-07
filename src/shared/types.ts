export interface Platform {
  id: string;
  name: string;
  skillsDir: string;
  rulesFile: string;
  enabled: boolean;
}

export interface SkillRepo {
  id: string;
  name: string;
  url: string;
  localPath: string;
  lastUpdated: string;
  updateStatus?: 'checking' | 'up-to-date' | 'behind' | 'error';
  behindCount?: number;
  checkError?: string;
}

export interface Skill {
  id: string;
  repoId: string;
  name: string;
  localPath: string;
  description: string;
  linkedPlatforms: string[];
}

export interface Rule {
  id: string;
  name: string;
  localPath: string;
  linkedPlatforms: string[];
}


export interface UpdateCheckResult {
  repoId: string;
  hasUpdates: boolean;
  behindCount: number;
  aheadCount: number;
  error?: string;
}

export interface GlobalConfig {
  version: number;
  gitPath?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'zh-CN' | 'en-US';
}

export interface PlatformConfig {
  name: string;
  skillsDir: string;
  rulesFile: string;
  enabled: boolean;
  linkedSkills: string[];
  linkedRules: string[];
}

export interface PlatformPreset extends Omit<PlatformConfig, 'enabled' | 'linkedSkills' | 'linkedRules'> {
  description?: string;
}
