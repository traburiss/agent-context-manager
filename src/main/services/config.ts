import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { debounce } from 'lodash';
import { SystemConfig, UserConfig, PlatformConfig, SkillRepo, Rule, PlatformPreset } from '../../shared/types';

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  version: 1,
  baseDir: '', // User needs to set this
  theme: 'system',
  language: 'zh-CN',
  presets: []
};

const DEFAULT_USER_CONFIG: UserConfig = {
  agents: [],
  skills: [],
  rules: []
};

export class ConfigService {
  private appDataPath: string;
  private systemConfigPath: string;
  
  // In-memory cache
  private systemConfig: SystemConfig | null = null;
  private userConfig: UserConfig | null = null;

  // Debounced save functions
  private saveSystemConfigDebounced: (config: SystemConfig) => void;
  private saveUserConfigDebounced: (config: UserConfig, baseDir: string) => void;

  constructor(appDataPath?: string) {
    this.appDataPath = appDataPath || path.join(app.getPath('appData'), 'AgentContextManager');
    this.systemConfigPath = path.join(this.appDataPath, 'config.yaml');

    // Initialize debounced save functions
    this.saveSystemConfigDebounced = debounce(async (config: SystemConfig) => {
      try {
        await fs.ensureDir(path.dirname(this.systemConfigPath));
        const header = '# ===================================================================\n# SYSTEM CONFIGURATION\n# ===================================================================\n\n';
        await fs.writeFile(this.systemConfigPath, header + yaml.dump(config));
      } catch (error) {
        console.error('Failed to save system config:', error);
      }
    }, 500);

    this.saveUserConfigDebounced = debounce(async (config: UserConfig, baseDir: string) => {
      if (!baseDir) return;
      const configDir = path.join(baseDir, 'config');
      try {
        await fs.ensureDir(configDir);

        // Save agents
        const agentsHeader = '# ===================================================================\n# AI AGENT CONFIGURATION\n# ===================================================================\n\n';
        await fs.writeFile(path.join(configDir, 'ai-agent.yaml'), agentsHeader + yaml.dump({ agents: config.agents }));

        // Save skills
        const skillsHeader = '# ===================================================================\n# SKILLS CONFIGURATION\n# ===================================================================\n\n';
        await fs.writeFile(path.join(configDir, 'skills.yaml'), skillsHeader + yaml.dump({ skills: config.skills }));

        // Save rules
        const rulesHeader = '# ===================================================================\n# RULES CONFIGURATION\n# ===================================================================\n\n';
        await fs.writeFile(path.join(configDir, 'rules.yaml'), rulesHeader + yaml.dump({ rules: config.rules }));

      } catch (error) {
        console.error('Failed to save user config:', error);
      }
    }, 500);
  }

  /**
   * Initialize configs (load from disk)
   */
  async initialize(): Promise<void> {
    await this.loadSystemConfig();
    if (this.systemConfig && this.systemConfig.baseDir) {
      await this.loadUserConfig(this.systemConfig.baseDir);
    } else {
      this.userConfig = { ...DEFAULT_USER_CONFIG };
    }
  }

  /**
   * System Config Operations
   */
  async loadSystemConfig(): Promise<SystemConfig> {
    try {
      if (await fs.pathExists(this.systemConfigPath)) {
        const content = await fs.readFile(this.systemConfigPath, 'utf-8');
        this.systemConfig = { ...DEFAULT_SYSTEM_CONFIG, ...yaml.load(content) as Partial<SystemConfig> };
      } else {
        this.systemConfig = { ...DEFAULT_SYSTEM_CONFIG };
        // Save default config immediately
        await this.saveSystemConfigDebounced(this.systemConfig);
      }
    } catch (error) {
      console.error('Failed to load system config, utilizing default:', error);
      this.systemConfig = { ...DEFAULT_SYSTEM_CONFIG };
    }
    return this.systemConfig;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    if (!this.systemConfig) {
      await this.loadSystemConfig();
    }
    return this.systemConfig || { ...DEFAULT_SYSTEM_CONFIG };
  }

  async setSystemConfig(patch: Partial<SystemConfig>): Promise<void> {
    if (!this.systemConfig) await this.loadSystemConfig();
    
    // Check if baseDir changed, if so, reload user config
    const oldBaseDir = this.systemConfig?.baseDir;
    
    this.systemConfig = { ...this.systemConfig!, ...patch };
    this.saveSystemConfigDebounced(this.systemConfig);

    if (patch.baseDir && patch.baseDir !== oldBaseDir) {
      await this.loadUserConfig(patch.baseDir);
    }
  }

  /**
   * User Config Operations
   */
  async loadUserConfig(baseDir: string): Promise<UserConfig> {
    const configDir = path.join(baseDir, 'config');
    const userConfig: UserConfig = { ...DEFAULT_USER_CONFIG };

    try {
      // Load agents
      const agentsPath = path.join(configDir, 'ai-agent.yaml');
      if (await fs.pathExists(agentsPath)) {
        const content = await fs.readFile(agentsPath, 'utf-8');
        const data = yaml.load(content) as { agents?: PlatformConfig[] };
        userConfig.agents = data?.agents || [];
      }

      // Load skills
      const skillsPath = path.join(configDir, 'skills.yaml');
      if (await fs.pathExists(skillsPath)) {
        const content = await fs.readFile(skillsPath, 'utf-8');
        const data = yaml.load(content) as { skills?: SkillRepo[] };
        userConfig.skills = data?.skills || [];
      }

      // Load rules
      const rulesPath = path.join(configDir, 'rules.yaml');
      if (await fs.pathExists(rulesPath)) {
        const content = await fs.readFile(rulesPath, 'utf-8');
        const data = yaml.load(content) as { rules?: Rule[] };
        userConfig.rules = data?.rules || [];
      }

    } catch (error) {
      console.error('Failed to load user config:', error);
    }

    this.userConfig = userConfig;
    return this.userConfig;
  }

  async getUserConfig(): Promise<UserConfig> {
    if (!this.userConfig) {
      const systemConfig = await this.getSystemConfig();
      if (systemConfig.baseDir) {
        await this.loadUserConfig(systemConfig.baseDir);
      }
    }
    return this.userConfig || { ...DEFAULT_USER_CONFIG };
  }

  async setUserConfig(patch: Partial<UserConfig>): Promise<void> {
    if (!this.userConfig) {
      if (this.systemConfig?.baseDir) {
        await this.loadUserConfig(this.systemConfig.baseDir);
      } else {
        console.warn('Cannot set user config: Base Dir not set');
        return;
      }
    }

    this.userConfig = { ...this.userConfig!, ...patch };
    
    if (this.systemConfig?.baseDir) {
      this.saveUserConfigDebounced(this.userConfig, this.systemConfig.baseDir);
    }
  }

  /**
   * Presets
   */
  async getPresets(): Promise<PlatformPreset[]> {
    const presetsDir = path.join(process.cwd(), 'resources', 'presets');
    const systemPresets = this.systemConfig?.presets || [];
    
    const builtInPresets: PlatformPreset[] = [];
    
    if (await fs.pathExists(presetsDir)) {
      const files = await fs.readdir(presetsDir);
      for (const file of files.filter(f => f.endsWith('.yaml'))) {
        try {
          const content = await fs.readFile(path.join(presetsDir, file), 'utf-8');
          const data = yaml.load(content) as PlatformPreset;
          builtInPresets.push({
            ...data,
            skillsDir: this.resolveVariables(data.skillsDir),
            rulesFile: this.resolveVariables(data.rulesFile)
          });
        } catch (error) {
          console.error(`Failed to load preset ${file}:`, error);
        }
      }
    }

    return [...builtInPresets, ...systemPresets];
  }

  public resolveVariables(value: string): string {
    const vars: Record<string, string> = {
      '${HOME}': process.env.HOME || process.env.USERPROFILE || '',
      '${APPDATA}': process.env.APPDATA || '',
      '${XDG_CONFIG_HOME}': process.env.XDG_CONFIG_HOME || (process.env.HOME ? path.join(process.env.HOME, '.config') : ''),
      '${LOCALAPPDATA}': process.env.LOCALAPPDATA || ''
    };

    let result = value;
    for (const [key, val] of Object.entries(vars)) {
      result = result.replace(new RegExp(key.replace('$', '\\$').replace('{', '\\{').replace('}', '\\}'), 'g'), val);
    }

    return result.split('/').join(path.sep);
  }
}
