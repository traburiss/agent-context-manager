
import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import { Rule } from '../../shared/types';

export class RuleService {
  private configDir: string;
  private rulesFile: string;

  constructor(baseDir: string) {
    this.configDir = path.join(baseDir, 'config');
    this.rulesFile = path.join(this.configDir, 'rules.yaml');
  }

  async list(): Promise<Rule[]> {
    if (!await fs.pathExists(this.rulesFile)) {
      return [];
    }

    const content = await fs.readFile(this.rulesFile, 'utf-8');
    return (yaml.load(content) as Rule[]) || [];
  }

  async get(id: string): Promise<Rule | null> {
    const rules = await this.list();
    return rules.find(r => r.id === id) || null;
  }

  async create(ruleData: Omit<Rule, 'id' | 'createdAt' | 'localPath' | 'linkedPlatforms'> & { localPath?: string; linkedPlatforms?: string[] }): Promise<Rule> {
    const rules = await this.list();
    const id = this.generateId(ruleData.name);
    
    if (rules.find(r => r.id === id)) {
      throw new Error(`Rule with ID ${id} already exists`);
    }

    const localPath = ruleData.localPath || path.join(this.configDir, 'rules', `${id}.md`);

    const newRule: Rule = {
      linkedPlatforms: [],
      ...ruleData,
      id,
      localPath,
      createdAt: new Date().toISOString()
    };

    rules.push(newRule);
    await this.saveRules(rules);
    
    // Create the rule file if it doesn't exist
    await fs.ensureFile(newRule.localPath);
    
    return newRule;
  }

  async update(rule: Rule): Promise<Rule> {
    const rules = await this.list();
    const index = rules.findIndex(r => r.id === rule.id);
    
    if (index === -1) {
      throw new Error(`Rule with ID ${rule.id} does not exist`);
    }

    rules[index] = rule;
    await this.saveRules(rules);
    return rule;
  }

  async delete(id: string): Promise<void> {
    const rules = await this.list();
    const index = rules.findIndex(r => r.id === id);
    
    if (index !== -1) {
      // Also delete the file? Maybe not, just the entry.
      // Requirements say "CRUD for Rules", implying the entry.
      // But if we created the file, maybe we should delete it?
      // For safety, let's keep the file for now, or maybe the user wants to keep it.
      // But wait, localPath is where the content is.
      // Let's just remove the entry from the list for now.
      rules.splice(index, 1);
      await this.saveRules(rules);
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

  private async saveRules(rules: Rule[]): Promise<void> {
    await fs.ensureDir(this.configDir);
    await fs.writeFile(this.rulesFile, yaml.dump(rules));
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
}
