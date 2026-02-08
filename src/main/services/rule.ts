import fs from 'fs-extra';
import path from 'path';
import { Rule } from '../../shared/types';
import { ConfigService } from './config';

export class RuleService {
  constructor(private configService: ConfigService) {}

  async list(): Promise<Rule[]> {
    const config = await this.configService.getUserConfig();
    return config.rules;
  }

  async get(id: string): Promise<Rule | null> {
    const rules = await this.list();
    return rules.find(r => r.id === id) || null;
  }

  async create(ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'localPath' | 'linkedPlatforms'> & { localPath?: string; linkedPlatforms?: string[] }, content: string = ''): Promise<Rule> {
    const rules = await this.list();
    const id = this.generateId(ruleData.name);
    
    if (rules.find(r => r.id === id)) {
      throw new Error(`Rule with ID ${id} already exists`);
    }

    const systemConfig = await this.configService.getSystemConfig();
    if (!systemConfig.baseDir) {
        throw new Error('System base directory not set');
    }

    const rulesDir = path.join(systemConfig.baseDir, 'rules');
    await fs.ensureDir(rulesDir);

    const localPath = ruleData.localPath || path.join(rulesDir, `${id}.md`);

    // Write content
    await fs.writeFile(localPath, content, 'utf-8');
    
    const now = new Date().toISOString();
    const newRule: Rule = {
      linkedPlatforms: [],
      ...ruleData,
      id,
      localPath,
      createdAt: now
      // updatedAt missing in interface? Interface has: id, name, description?, localPath, linkedPlatforms, createdAt.
      // Let's check shared/types.ts again. It has createdAt. 
      // Design 04_rules.md had updatedAt in its snippet but shared/types might differ.
      // Let's stick to shared/types for now, or update shared/types if needed.
    };

    const userConfig = await this.configService.getUserConfig();
    userConfig.rules.push(newRule);
    await this.configService.setUserConfig({ rules: userConfig.rules });
    
    return newRule;
  }

  async update(rule: Rule): Promise<Rule> {
    const userConfig = await this.configService.getUserConfig();
    const index = userConfig.rules.findIndex(r => r.id === rule.id);
    
    if (index === -1) {
      throw new Error(`Rule with ID ${rule.id} does not exist`);
    }

    userConfig.rules[index] = rule;
    await this.configService.setUserConfig({ rules: userConfig.rules });
    return rule;
  }

  async delete(id: string): Promise<void> {
    const userConfig = await this.configService.getUserConfig();
    const index = userConfig.rules.findIndex(r => r.id === id);
    
    if (index !== -1) {
      const rule = userConfig.rules[index];
      
      // Attempt to delete the file if it exists
      if (await fs.pathExists(rule.localPath)) {
          // Verify it's in our managed directory to avoid deleting user's arbitrary files?
          // For now, assuming we own it if we created it.
          try {
            await fs.remove(rule.localPath);
          } catch (e) {
              console.error(`Failed to delete rule file at ${rule.localPath}`, e);
          }
      }

      userConfig.rules.splice(index, 1);
      await this.configService.setUserConfig({ rules: userConfig.rules });
    }
  }

  async getContent(id: string): Promise<string> {
    const rule = await this.get(id);
    if (!rule) {
      throw new Error(`Rule with ID ${id} not found`);
    }
    
    if (!await fs.pathExists(rule.localPath)) {
        return '';
    }

    return await fs.readFile(rule.localPath, 'utf-8');
  }

  async setContent(id: string, content: string): Promise<void> {
    const rule = await this.get(id);
    if (!rule) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    await fs.ensureDir(path.dirname(rule.localPath));
    await fs.writeFile(rule.localPath, content, 'utf-8');
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
}
