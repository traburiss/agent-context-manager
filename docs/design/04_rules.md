# Rules 管理

## 概述

Rules 管理模块负责创建、编辑用户的全局规则文件，并通过符号链接或文件内容合并部署到各 AI Agent。

## 数据模型

```typescript
// src/shared/types.ts

export interface Rule {
  id: string;
  name: string;
  localPath: string;
  linkedPlatforms: string[];
  createdAt: string;
  updatedAt: string;
}
```

## 文件结构

Rules 存储在 `<Manager Base Dir>/rules/` 目录下：

```text
rules/
├── global.md           # 全局通用规则
├── coding-style.md     # 编码风格规则
├── security.md         # 安全相关规则
└── ...
```

### 服务实现

```typescript
// src/main/services/rule.ts
import { ConfigurationService } from './config/ConfigurationService';

export class RuleService {
  private rulesDir: string;

  constructor(baseDir: string, private configService: ConfigurationService) {
    this.rulesDir = path.join(baseDir, 'rules');
  }

  async list(): Promise<Rule[]> {
    // 从配置文件读取 Rules 元数据
    const config = await this.configService.getUserConfig();
    return config.rules;
  }

  async create(name: string, content: string = ''): Promise<Rule> {
    const fileName = `${name}.md`;
    const filePath = path.join(this.rulesDir, fileName);

    if (await fs.pathExists(filePath)) {
      throw new Error(`Rule already exists: ${name}`);
    }

    await fs.writeFile(filePath, content);
    const stats = await fs.stat(filePath);

    const newRule: Rule = {
      id: name,
      name,
      localPath: filePath,
      linkedPlatforms: [],
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };

    // 更新配置文件
    const config = await this.configService.getUserConfig();
    config.rules.push(newRule);
    await this.configService.saveUserConfig();

    return newRule;
  }

  // ... 其他方法需同步更新 Config
}
```

## 部署策略

由于不同 AI Agent的 Rules 文件格式和位置各不相同，采用**内容合并**策略：

```typescript
// src/main/services/rule-deploy.ts

export class RuleDeployService {
  async deploy(ruleId: string, platformId: string): Promise<void> {
    const platform = await this.platformService.get(platformId);
    const ruleContent = await this.ruleService.read(ruleId);

    const rulesFile = platform.rulesFile;
    let existingContent = '';

    if (await fs.pathExists(rulesFile)) {
      existingContent = await fs.readFile(rulesFile, 'utf-8');
    }

    const marker = this.generateMarker(ruleId);
    const newContent = this.mergeContent(existingContent, ruleContent, marker);

    await fs.ensureDir(path.dirname(rulesFile));
    await fs.writeFile(rulesFile, newContent);
  }

  async undeploy(ruleId: string, platformId: string): Promise<void> {
    const platform = await this.platformService.get(platformId);
    const rulesFile = platform.rulesFile;

    if (!await fs.pathExists(rulesFile)) return;

    const content = await fs.readFile(rulesFile, 'utf-8');
    const marker = this.generateMarker(ruleId);
    const newContent = this.removeContent(content, marker);

    await fs.writeFile(rulesFile, newContent);
  }

  private generateMarker(ruleId: string): { start: string; end: string } {
    return {
      start: `<!-- SKILLS_MANAGER_RULE_START:${ruleId} -->`,
      end: `<!-- SKILLS_MANAGER_RULE_END:${ruleId} -->`
    };
  }

  private mergeContent(existing: string, rule: string, marker: { start: string; end: string }): string {
    const cleaned = this.removeContent(existing, marker);
    return `${cleaned}\n\n${marker.start}\n${rule}\n${marker.end}`.trim();
  }

  private removeContent(content: string, marker: { start: string; end: string }): string {
    const regex = new RegExp(`\\n*${marker.start}[\\s\\S]*?${marker.end}\\n*`, 'g');
    return content.replace(regex, '').trim();
  }
}
```

## 界面设计

### Rules 列表

```text
┌─────────────────────────────────────────────────────────────┐
│  Rules 管理                                    [+ 新建规则] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📜 global                                           │    │
│  │    📁 ~/.skills-manager/rules/global.md       [📁]  │    │
│  │    已部署: Antigravity, Claude Code                 │    │
│  │                               [🗑️ 删除] [📋 查看]   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📜 coding-style                                     │    │
│  │    📁 ~/.skills-manager/rules/coding-style.md [📁]  │    │
│  │    未部署                                           │    │
│  │                               [🗑️ 删除] [📋 查看]   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Rule 查看/编辑页

```text
┌─────────────────────────────────────────────────────────────┐
│  ← 返回  global.md                              [💾 保存]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  编辑器                         │    部署到AI Agent             │
│  ─────────────────────────────  │    ─────────────────────  │
│  # Global Rules                 │    ☑ Antigravity          │
│                                 │    ☑ Claude Code          │
│  - 使用简体中文                 │    ☐ Gemini CLI           │
│  - 代码注释简洁                 │    ☐ OpenCode             │
│  - 遵循项目规范                 │                           │
│                                 │                           │
│                                 │                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## IPC 接口

| Channel | Direction | 参数 | 返回值 |
|---------|-----------|------|--------|
| `rule:list` | R → M | - | `Rule[]` |
| `rule:create` | R → M | `name: string` | `Rule` |
| `rule:read` | R → M | `id: string` | `string` |
| `rule:update` | R → M | `id: string, content: string` | `void` |
| `rule:delete` | R → M | `id: string` | `void` |
| `rule:deploy` | R → M | `ruleId: string, platformId: string` | `void` |
| `rule:undeploy` | R → M | `ruleId: string, platformId: string` | `void` |
