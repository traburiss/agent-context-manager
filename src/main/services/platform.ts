import { Platform } from '../../shared/types';
import { ConfigService } from './config';

export class PlatformService {
  constructor(private configService: ConfigService) {}

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
      // We save paths AS IS (potentially with variables)
      // The frontend should ensure it sends variables if desired, or resolved paths if not.
      // Ideally, we might want to "un-resolve" paths here, but that's complex. 
      // For now we assume input paths are what we want to store.
    };

    config.agents.push(newPlatform);
    await this.configService.setUserConfig({ agents: config.agents });

    // Return the created platform (with variables resolved if we called list(), but here we return what we saved?)
    // Consistency: list() returns resolved. create() should probably return what was passed + id.
    // If we want consistency, we should return resolved version.
    
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

    // Update the agent in the list
    // Warning: If 'platform' comes from frontend with RESOLVED paths, we might be overwriting variables with absolute paths.
    // This is a known trade-off unless we have a separate DTO. 
    // For this refactor, we accept that update might persist resolved paths.
    
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

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
}
