# AI Agent管理

## 概述

AI Agent管理模块负责管理用户的 AI 开发工具平台配置，支持预设快速配置和自定义路径。

## 数据模型

```typescript
// src/shared/types.ts

export interface Platform {
  id: string;
  name: string;
  skillsDir: string;
  rulesFile: string;
  enabled: boolean;
  linkedSkills: string[];
  linkedRules: string[];
}

export interface PlatformPreset {
  name: string;
  skillsDir: string;
  rulesFile: string;
}
```

## 内置预设

支持以下 AI Agent的预设配置：

| AI Agent | Skills 目录 | Rules 文件 |
|------|------------|-----------|
| Antigravity | `${HOME}/.gemini/antigravity/skills` | `${HOME}/.gemini/antigravity/AGENTS.MD` |
| Claude Code | `${HOME}/.claude/skills` | `${HOME}/.claude/CLAUDE.MD` |
| Gemini CLI | `${HOME}/.gemini/cli/skills` | `${HOME}/.gemini/cli/AGENTS.MD` |
| OpenCode | `${HOME}/.opencode/skills` | `${HOME}/.opencode/rules.md` |
| Codex | `${HOME}/.codex/skills` | `${HOME}/.codex/AGENTS.MD` |
| Qoder | `${HOME}/.qoder/skills` | `${HOME}/.qoder/rules.md` |
| Trae | `${HOME}/.trae/skills` | `${HOME}/.trae/rules.md` |

### 变量替换规则

```typescript
// src/main/services/platform.ts

function resolvePathVariables(path: string): string {
  const vars: Record<string, string> = {
    '${HOME}': process.env.HOME || process.env.USERPROFILE || '',
    '${APPDATA}': process.env.APPDATA || '',
    '${XDG_CONFIG_HOME}': process.env.XDG_CONFIG_HOME || `${process.env.HOME}/.config`
  };

  let resolved = path;
  for (const [key, value] of Object.entries(vars)) {
    resolved = resolved.replace(new RegExp(key.replace('$', '\\$'), 'g'), value);
  }
  return resolved.replace(/\//g, path.sep);
}
```

## 界面设计

### AI Agent列表

```text
┌─────────────────────────────────────────────────────────────┐
│  AI Agent管理                                    [+ 添加AI Agent] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ● Antigravity                                       │    │
│  │   Skills: ~/.gemini/antigravity/skills        [📁]  │    │
│  │   Rules:  ~/.gemini/antigravity/AGENTS.MD     [📄]  │    │
│  │                                          [🗑️ 删除]  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ○ Claude Code                                       │    │
│  │   Skills: ~/.claude/skills                    [📁]  │    │
│  │   Rules:  ~/.claude/CLAUDE.MD                 [📄]  │    │
│  │                                          [🗑️ 删除]  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 添加AI Agent对话框

```text
┌─────────────────────────────────────────────┐
│  添加 AI Agent                               │
├─────────────────────────────────────────────┤
│  快速选择预设:                              │
│  [Antigravity] [Claude Code] [Gemini CLI]   │
│  [OpenCode] [Codex] [Qoder] [Trae]          │
│                                             │
│  ─────────── 或自定义 ───────────           │
│                                             │
│  名称:      [________________________]      │
│  Skills 目录: [__________________] [浏览]   │
│  Rules 文件:  [__________________] [浏览]   │
│                                             │
│                    [取消]  [确认]           │
└─────────────────────────────────────────────┘
```

## IPC 接口

| Channel | Direction | 参数 | 返回值 |
|---------|-----------|------|--------|
| `platform:list` | R → M | - | `Platform[]` |
| `platform:get-presets` | R → M | - | `PlatformPreset[]` |
| `platform:create` | R → M | `Platform` | `Platform` |
| `platform:update` | R → M | `Platform` | `Platform` |
| `platform:delete` | R → M | `id: string` | `void` |
| `platform:toggle` | R → M | `id: string` | `Platform` |
| `platform:open-dir` | R → M | `path: string` | `void` |
| `platform:open-file` | R → M | `path: string` | `void` |

## 服务实现

```typescript
// src/main/services/platform.ts

export class PlatformService {
  private configDir: string;

  constructor(baseDir: string) {
    this.configDir = path.join(baseDir, 'config', 'platforms');
  }

  async list(): Promise<Platform[]> {
    const files = await fs.readdir(this.configDir);
    const platforms: Platform[] = [];

    for (const file of files.filter(f => f.endsWith('.yaml'))) {
      const content = await fs.readFile(path.join(this.configDir, file), 'utf-8');
      const data = yaml.load(content) as Platform;
      data.id = path.basename(file, '.yaml');
      platforms.push(data);
    }

    return platforms;
  }

  async create(platform: Omit<Platform, 'id'>): Promise<Platform> {
    const id = this.generateId(platform.name);
    const filePath = path.join(this.configDir, `${id}.yaml`);

    const data: Platform = { ...platform, id };
    await fs.writeFile(filePath, yaml.dump(data));

    return data;
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.configDir, `${id}.yaml`);
    await fs.remove(filePath);
  }
}
```
