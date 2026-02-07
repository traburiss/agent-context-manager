import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import { GlobalConfig, PlatformPreset } from '../../shared/types';

export class ConfigService {
  private configDir: string;

  constructor(baseDir: string) {
    this.configDir = path.join(baseDir, 'config');
  }

  async getGlobalConfig(): Promise<GlobalConfig> {
    const configPath = path.join(this.configDir, 'config.yaml');

    if (!await fs.pathExists(configPath)) {
      return { version: 1 };
    }

    const content = await fs.readFile(configPath, 'utf-8');
    return yaml.load(content) as GlobalConfig;
  }

  async setGlobalConfig(config: Partial<GlobalConfig>): Promise<void> {
    const current = await this.getGlobalConfig();
    const merged = { ...current, ...config };
    await fs.ensureDir(this.configDir);
    const configPath = path.join(this.configDir, 'config.yaml');
    await fs.writeFile(configPath, yaml.dump(merged));
  }

  async getPresets(): Promise<PlatformPreset[]> {
    const presetsDir = path.join(process.cwd(), 'resources', 'presets');
    if (!await fs.pathExists(presetsDir)) {
      return [];
    }

    const files = await fs.readdir(presetsDir);
    const presets: PlatformPreset[] = [];

    for (const file of files.filter(f => f.endsWith('.yaml'))) {
      const content = await fs.readFile(path.join(presetsDir, file), 'utf-8');
      const data = yaml.load(content) as PlatformPreset;
      presets.push({
        ...data,
        skillsDir: this.resolveVariables(data.skillsDir),
        rulesFile: this.resolveVariables(data.rulesFile)
      });
    }

    return presets;
  }

  private resolveVariables(value: string): string {
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

    // Replace forward slashes with system separator
    return result.split('/').join(path.sep);
  }
}
