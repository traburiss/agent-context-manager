
import fs from 'fs-extra';
import { PlatformService } from './platform';
import { RuleService } from './rule';

export class RuleDeployService {
  constructor(
    private platformService: PlatformService,
    private ruleService: RuleService
  ) {}

  async deploy(platformId: string): Promise<void> {
    const platform = await this.platformService.get(platformId);
    if (!platform) {
      throw new Error(`Platform with ID ${platformId} not found`);
    }

    // Since we added linkedRules to Platform interface, we can use it.
    // If it's undefined, we fallback to empty array.
    const linkedRuleIds = platform.linkedRules || [];
    
    if (linkedRuleIds.length === 0) {
        // If no rules are linked, maybe we should clear the rules file?
        // Or maybe do nothing?
        // Let's clear it to ensure consistency (empty rules).
        if (platform.rulesFile) {
             await fs.ensureFile(platform.rulesFile);
             await fs.writeFile(platform.rulesFile, '');
        }
        return;
    }

    const rulesContent: string[] = [];

    for (const ruleId of linkedRuleIds) {
      try {
        const content = await this.ruleService.getContent(ruleId);
        if (content) {
          rulesContent.push(content);
        }
      } catch (error) {
        console.warn(`Failed to get content for rule ${ruleId} during deployment`, error);
      }
    }

    const mergedContent = rulesContent.join('\n\n');
    
    if (platform.rulesFile) {
        await fs.ensureFile(platform.rulesFile);
        await fs.writeFile(platform.rulesFile, mergedContent);
    }
  }
}
