# 配置系统

## 概述

配置系统采用 YAML 格式，支持分层配置和环境变量替换。

## 配置文件结构

```text
<Manager Base Dir>/config/
├── config.yaml              # 全局配置
├── platforms/               # AI Agent配置
│   ├── antigravity.yaml
│   ├── claude-code.yaml
│   └── ...
└── presets/                 # AI Agent预设模板
    ├── antigravity.yaml
    ├── claude-code.yaml
    └── ...
```

## 配置 Schema

### config.yaml

```typescript
interface GlobalConfig {
  version: number;
  gitPath?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'zh-CN' | 'en-US';
}
```

```yaml
version: 1
gitPath: "git"
theme: "system"
language: "zh-CN"
```

### platforms/*.yaml

```typescript
interface PlatformConfig {
  name: string;
  skillsDir: string;
  rulesFile: string;
  enabled: boolean;
  linkedSkills: string[];
  linkedRules: string[];
}
```

```yaml
name: Antigravity
skillsDir: "C:/Users/xxx/.gemini/antigravity/skills"
rulesFile: "C:/Users/xxx/.gemini/antigravity/AGENTS.MD"
enabled: true
linkedSkills:
  - "awesome-skills/frontend-design"
  - "awesome-skills/pdf"
linkedRules:
  - "global"
```

### presets/*.yaml

预设模板使用变量占位符，运行时动态解析：

```yaml
name: Antigravity
skillsDir: "${HOME}/.gemini/antigravity/skills"
rulesFile: "${HOME}/.gemini/antigravity/AGENTS.MD"
```

## 服务实现

```typescript
// src/main/services/config.ts

import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';

export class ConfigService {
  private baseDir: string;
  private configDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
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
    const configPath = path.join(this.configDir, 'config.yaml');
    await fs.writeFile(configPath, yaml.dump(merged));
  }

  async getPresets(): Promise<PlatformPreset[]> {
    const presetsDir = path.join(this.configDir, 'presets');
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
      '${XDG_CONFIG_HOME}': process.env.XDG_CONFIG_HOME || `${process.env.HOME}/.config`,
      '${LOCALAPPDATA}': process.env.LOCALAPPDATA || ''
    };

    let result = value;
    for (const [key, val] of Object.entries(vars)) {
      result = result.replace(new RegExp(key.replace('$', '\\$'), 'g'), val);
    }

    return result.replace(/\//g, path.sep);
  }
}
```

## 内置预设列表

| AI Agent | 预设文件 | Skills 目录 | Rules 文件 |
|------|---------|------------|-----------|
| Antigravity | `antigravity.yaml` | `${HOME}/.gemini/antigravity/skills` | `${HOME}/.gemini/antigravity/AGENTS.MD` |
| Claude Code | `claude-code.yaml` | `${HOME}/.claude/skills` | `${HOME}/.claude/CLAUDE.MD` |
| Gemini CLI | `gemini-cli.yaml` | `${HOME}/.gemini/cli/skills` | `${HOME}/.gemini/cli/AGENTS.MD` |
| OpenCode | `opencode.yaml` | `${HOME}/.opencode/skills` | `${HOME}/.opencode/rules.md` |
| Codex | `codex.yaml` | `${HOME}/.codex/skills` | `${HOME}/.codex/AGENTS.MD` |
| Qoder | `qoder.yaml` | `${HOME}/.qoder/skills` | `${HOME}/.qoder/rules.md` |
| Trae | `trae.yaml` | `${HOME}/.trae/skills` | `${HOME}/.trae/rules.md` |

## IPC 接口

| Channel | Direction | 参数 | 返回值 |
|---------|-----------|------|--------|
| `config:get` | R → M | - | `GlobalConfig` |
| `config:set` | R → M | `Partial<GlobalConfig>` | `void` |
| `config:get-base-dir` | R → M | - | `string` |
| `config:get-presets` | R → M | - | `PlatformPreset[]` |
