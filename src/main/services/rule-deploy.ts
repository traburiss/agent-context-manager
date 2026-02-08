import fs from 'fs-extra';
import path from 'path';
import { PlatformService } from './platform';
import { RuleService } from './rule';

export class RuleDeployService {
  constructor(
    private platformService: PlatformService,
    private ruleService: RuleService
  ) {}

  async deploy(ruleId: string, platformId: string): Promise<void> {
    const platform = await this.platformService.get(platformId);
    if (!platform) {
      throw new Error(`Platform with ID ${platformId} not found`);
    }

    const ruleContent = await this.ruleService.getContent(ruleId);
    if (!ruleContent) return; // Warning?

    const rulesFile = platform.rulesFile;
    if (!rulesFile) {
        throw new Error(`Platform ${platform.name} has no rulesFile configured`);
    }

    let existingContent = '';
    if (await fs.pathExists(rulesFile)) {
      existingContent = await fs.readFile(rulesFile, 'utf-8');
    }

    const marker = this.generateMarker(ruleId);
    const newContent = this.mergeContent(existingContent, ruleContent, marker);

    await fs.ensureDir(path.dirname(rulesFile));
    await fs.writeFile(rulesFile, newContent);

    // Update Rule linked platforms
    const rule = await this.ruleService.get(ruleId);
    if (rule && !rule.linkedPlatforms.includes(platformId)) {
        rule.linkedPlatforms.push(platformId);
        await this.ruleService.update(rule);
    }

    // Update Platform linked rules
    if (!platform.linkedRules) platform.linkedRules = [];
    if (!platform.linkedRules.includes(ruleId)) {
        platform.linkedRules.push(ruleId);
        await this.platformService.update(platform);
    }
  }

  async undeploy(ruleId: string, platformId: string): Promise<void> {
    const platform = await this.platformService.get(platformId);
    if (!platform) {
        throw new Error(`Platform with ID ${platformId} not found`);
    }

    const rulesFile = platform.rulesFile;
    if (!rulesFile || !await fs.pathExists(rulesFile)) {
        return;
    }

    const content = await fs.readFile(rulesFile, 'utf-8');
    const marker = this.generateMarker(ruleId);
    const newContent = this.removeContent(content, marker);

    await fs.writeFile(rulesFile, newContent);

    // Update Rule linked platforms
    const rule = await this.ruleService.get(ruleId);
    if (rule) {
        rule.linkedPlatforms = rule.linkedPlatforms.filter(p => p !== platformId);
        await this.ruleService.update(rule);
    }

    // Update Platform linked rules
    if (platform.linkedRules) {
        platform.linkedRules = platform.linkedRules.filter(r => r !== ruleId);
        await this.platformService.update(platform);
    }
  }

  private generateMarker(ruleId: string): { start: string; end: string } {
    return {
      start: `<!-- SKILLS_MANAGER_RULE_START:${ruleId} -->`,
      end: `<!-- SKILLS_MANAGER_RULE_END:${ruleId} -->`
    };
  }

  private mergeContent(existing: string, rule: string, marker: { start: string; end: string }): string {
    const cleaned = this.removeContent(existing, marker);
    // Ensure we append to end or appropriate section? 
    // Appending to end is safest for now.
    // Ensure newline separation
    const prefix = cleaned.length > 0 && !cleaned.endsWith('\n') ? '\n\n' : (cleaned.length > 0 ? '\n' : '');
    
    return `${cleaned}${prefix}${marker.start}\n${rule}\n${marker.end}`;
  }

  private removeContent(content: string, marker: { start: string; end: string }): string {
    // Escape special chars in marker for regex
    const start = this.escapeRegExp(marker.start);
    const end = this.escapeRegExp(marker.end);
    
    // Regex to match start marker, anything in between (non-greedy), and end marker
    // And also potentially preceding/trailing newlines to keep it clean
    const regex = new RegExp(`\\n*${start}[\\s\\S]*?${end}\\n*`, 'g');
    return content.replace(regex, '').trim();
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  }
}
