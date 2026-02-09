import { Platform } from '../../shared/types';
import { shell } from 'electron';
import { ConfigService } from './config';
import fs from 'fs-extra';

export class PlatformService {
  constructor(private configService: ConfigService) {}

  // ... (existing methods list, get, create, update, delete, getPresets)

  async list(): Promise<Platform[]> {
    const config = await this.configService.getUserConfig();
    
    // Return with resolved paths for usage
    return config.agents.map(agent => ({
      ...agent,
      skillsDir: this.configService.resolveVariables(agent.skillsDir),
      rulesFile: this.configService.resolveVariables(agent.rulesFile)
    }));
  }

  async get(id: string): Promise<Platform | null> {
    const platforms = await this.list();
    return platforms.find(p => p.id === id) || null;
  }

  async create(platform: Omit<Platform, 'id'> & { id?: string }): Promise<Platform> {
    const config = await this.configService.getUserConfig();
    const id = platform.id || this.generateId(platform.name);

    if (config.agents.some(p => p.id === id)) {
      throw new Error(`Platform with ID ${id} already exists`);
    }

    const newPlatform: Platform = {
      ...platform,
      id,
      linkedSkills: platform.linkedSkills || [],
      linkedRules: platform.linkedRules || [],
    };

    const platformToSave = {
        ...newPlatform,
        linkedSkills: newPlatform.linkedSkills || [],
        linkedRules: newPlatform.linkedRules || []
    };
    config.agents.push(platformToSave);
    await this.configService.setUserConfig({ agents: config.agents });
    
    return {
      ...newPlatform,
      skillsDir: this.configService.resolveVariables(newPlatform.skillsDir),
      rulesFile: this.configService.resolveVariables(newPlatform.rulesFile)
    };
  }

  async update(platform: Platform): Promise<Platform> {
    const config = await this.configService.getUserConfig();
    const index = config.agents.findIndex(p => p.id === platform.id);

    if (index === -1) {
      throw new Error(`Platform with ID ${platform.id} does not exist`);
    }

    const updatedPlatform = { ...config.agents[index], ...platform };
    config.agents[index] = updatedPlatform;

    await this.configService.setUserConfig({ agents: config.agents });

    return {
      ...updatedPlatform,
      skillsDir: this.configService.resolveVariables(updatedPlatform.skillsDir),
      rulesFile: this.configService.resolveVariables(updatedPlatform.rulesFile)
    };
  }

  async delete(id: string): Promise<void> {
    const config = await this.configService.getUserConfig();
    const initialLength = config.agents.length;
    config.agents = config.agents.filter(p => p.id !== id);
    
    if (config.agents.length !== initialLength) {
        await this.configService.setUserConfig({ agents: config.agents });
    }
  }

  async getPresets() {
    return this.configService.getPresets();
  }

  async openPath(pathStr: string): Promise<string> {
    try {
      const resolvedPath = this.configService.resolveVariables(pathStr);
      // Check if path exists
      if (!await fs.pathExists(resolvedPath)) {
          console.error(`Path does not exist: ${resolvedPath}`);
          return `Path does not exist: ${resolvedPath}`;
      }
      
      console.log(`Opening path: ${resolvedPath}`);
      const error = await shell.openPath(resolvedPath);
      if (error) {
          console.error(`Error opening path: ${error}`);
      }
      return error;
    } catch (err: unknown) {
      console.error('Failed to open path:', err);
      return err instanceof Error ? err.message : 'Unknown error';
    }
  }

  async openFileLocation(pathStr: string): Promise<string> {
      try {
          const resolvedPath = this.configService.resolveVariables(pathStr);
           if (!await fs.pathExists(resolvedPath)) {
                console.error(`File does not exist: ${resolvedPath}`);
                return `File does not exist: ${resolvedPath}`;
            }

          console.log(`Showing item in folder: ${resolvedPath}`);
          shell.showItemInFolder(resolvedPath);
          return '';
      } catch (err: unknown) {
          console.error('Failed to open file location:', err);
          return err instanceof Error ? err.message : 'Unknown error';
      }
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
}

