import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import { Platform } from '../../shared/types';

export class PlatformService {
  private configDir: string;

  constructor(baseDir: string) {
    this.configDir = path.join(baseDir, 'config', 'platforms');
  }

  async list(): Promise<Platform[]> {
    if (!await fs.pathExists(this.configDir)) {
      return [];
    }

    const files = await fs.readdir(this.configDir);
    const platforms: Platform[] = [];

    for (const file of files.filter(f => f.endsWith('.yaml'))) {
      try {
        const content = await fs.readFile(path.join(this.configDir, file), 'utf-8');
        const data = yaml.load(content) as Platform;
        
        // Ensure ID matches filename
        data.id = path.basename(file, '.yaml');
        
        // Resolve variables in paths
        data.skillsDir = this.resolvePathVariables(data.skillsDir);
        data.rulesFile = this.resolvePathVariables(data.rulesFile);
        
        platforms.push(data);
      } catch (error) {
        console.error(`Failed to load platform config: ${file}`, error);
      }
    }

    return platforms;
  }

  async get(id: string): Promise<Platform | null> {
    const filePath = path.join(this.configDir, `${id}.yaml`);
    if (!await fs.pathExists(filePath)) {
      return null;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content) as Platform;
    data.id = id;
    data.skillsDir = this.resolvePathVariables(data.skillsDir);
    data.rulesFile = this.resolvePathVariables(data.rulesFile);

    return data;
  }

  async create(platform: Omit<Platform, 'id'> & { id?: string }): Promise<Platform> {
    const id = platform.id || this.generateId(platform.name);
    await fs.ensureDir(this.configDir);
    const filePath = path.join(this.configDir, `${id}.yaml`);

    if (await fs.pathExists(filePath)) {
      throw new Error(`Platform with ID ${id} already exists`);
    }

    const data: Platform = { ...platform, id };
    // We save paths AS IS (with variables), resolution happens on read
    await fs.writeFile(filePath, yaml.dump(data));

    return data;
  }

  async update(platform: Platform): Promise<Platform> {
    const filePath = path.join(this.configDir, `${platform.id}.yaml`);
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Platform with ID ${platform.id} does not exist`);
    }

    // When updating, we might receive resolved paths. 
    // Ideally, the frontend should send back paths with variables if they want to preserve them.
    // For now, we save what we get.
    
    await fs.writeFile(filePath, yaml.dump(platform));
    return platform;
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.configDir, `${id}.yaml`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  private resolvePathVariables(value: string): string {
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
