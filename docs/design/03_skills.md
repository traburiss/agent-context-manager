# Skills 管理

## 概述

Skills 管理模块负责从 Git 仓库拉取技能包，并将技能通过符号链接部署到各 AI Agent。

## 数据模型

```typescript
// src/shared/types.ts

export interface SkillRepo {
  id: string;
  name: string;
  url: string;
  localPath: string;
  lastUpdated: string;
  updateStatus?: 'checking' | 'up-to-date' | 'behind' | 'error';
  behindCount?: number;
  checkError?: string;
}

export interface Skill {
  id: string;
  repoId: string;
  name: string;
  localPath: string;
  description: string;
  linkedPlatforms: string[];
}

export interface UpdateCheckResult {
  repoId: string;
  hasUpdates: boolean;
  behindCount: number;
  aheadCount: number;
  error?: string;
}
```

## Git 仓库管理

### URL 解析规则

```typescript
// src/main/services/git.ts

export function normalizeGitUrl(input: string): string {
  if (input.startsWith('https://') || input.startsWith('git@')) {
    return input;
  }
  if (input.includes('/')) {
    return `https://github.com/${input}.git`;
  }
  throw new Error('Invalid repository format');
}

// 示例:
// "anthropics/awesome-skills" → "https://github.com/anthropics/awesome-skills.git"
// "https://github.com/user/repo" → "https://github.com/user/repo"
```

### 仓库操作

```typescript
// src/main/services/git.ts
import simpleGit, { SimpleGit } from 'simple-git';
import { ConfigurationService } from './config/ConfigurationService';

export class GitService {
  private git: SimpleGit;
  private skillsDir: string;

  constructor(baseDir: string, private configService: ConfigurationService) {
    this.skillsDir = path.join(baseDir, 'skills');
    this.git = simpleGit();
  }

  async clone(url: string): Promise<SkillRepo> {
    const normalizedUrl = normalizeGitUrl(url);
    const repoName = this.extractRepoName(normalizedUrl);
    const localPath = path.join(this.skillsDir, repoName);

    await this.git.clone(normalizedUrl, localPath);

    const newRepo: SkillRepo = {
      id: repoName,
      name: repoName,
      url: normalizedUrl,
      localPath,
      lastUpdated: new Date().toISOString()
    };

    // 更新配置文件
    const config = await this.configService.getUserConfig();
    config.skills.push(newRepo);
    await this.configService.saveUserConfig();

    return newRepo;
  }
  
  // ... 其他方法需同步更新 Config
}
```

## Skill 检测

扫描仓库目录，识别包含 `SKILL.MD` 的子目录作为有效技能：

```typescript
// src/main/services/skill.ts

export async function scanSkills(repoPath: string): Promise<Skill[]> {
  const skills: Skill[] = [];

  async function scan(dir: string, depth: number = 0): Promise<void> {
    if (depth > 3) return;

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const subPath = path.join(dir, entry.name);
      const skillFile = path.join(subPath, 'SKILL.MD');

      if (await fs.pathExists(skillFile)) {
        const content = await fs.readFile(skillFile, 'utf-8');
        skills.push({
          id: path.relative(repoPath, subPath).replace(/\\/g, '/'),
          repoId: path.basename(repoPath),
          name: entry.name,
          localPath: subPath,
          description: extractDescription(content),
          linkedPlatforms: []
        });
      } else {
        await scan(subPath, depth + 1);
      }
    }
  }

  await scan(repoPath);
  return skills;
}

function extractDescription(skillMd: string): string {
  const match = skillMd.match(/description:\s*(.+)/i);
  return match ? match[1].trim() : '';
}
```

## 符号链接管理

```typescript
// src/main/services/symlink.ts

export class SymlinkService {
  async link(sourcePath: string, targetDir: string): Promise<void> {
    const linkName = path.basename(sourcePath);
    const linkPath = path.join(targetDir, linkName);

    if (await fs.pathExists(linkPath)) {
      const stats = await fs.lstat(linkPath);
      if (stats.isSymbolicLink()) {
        await fs.remove(linkPath);
      } else {
        throw new Error(`Target exists and is not a symlink: ${linkPath}`);
      }
    }

    await fs.ensureDir(targetDir);
    await fs.symlink(sourcePath, linkPath, 'junction');
  }

  async unlink(sourcePath: string, targetDir: string): Promise<void> {
    const linkName = path.basename(sourcePath);
    const linkPath = path.join(targetDir, linkName);

    if (await fs.pathExists(linkPath)) {
      const stats = await fs.lstat(linkPath);
      if (stats.isSymbolicLink()) {
        await fs.remove(linkPath);
      }
    }
  }
}
```

## 界面设计

### 仓库列表

```text
┌─────────────────────────────────────────────────────────────┐
│  Skills 管理                                   [+ 添加仓库] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📦 awesome-skills                    🔔 3 个更新    │    │
│  │    🔗 github.com/anthropics/awesome-skills    [🌐]  │    │
│  │    📁 ~/.skills-manager/skills/awesome-skills [📁]  │    │
│  │                               [⬇ 更新] [📋 详情]   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📦 my-skills                         ✅ 已是最新   │    │
│  │    🔗 github.com/user/my-skills            [🌐]     │    │
│  │    📁 ~/.skills-manager/skills/my-skills   [📁]     │    │
│  │                               [🔄 检查] [📋 详情]   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

更新状态标识：
- 🔄 检查中 (checking)
- ✅ 已是最新 (up-to-date)
- 🔔 N 个更新 (behind)
- ⚠️ 检查失败 (error)
```

### 仓库详情页

```text
┌─────────────────────────────────────────────────────────────┐
│  ← 返回  awesome-skills         🔔 3 个更新  [⬇ 拉取更新]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Skills 列表                    │    部署到AI Agent             │
│  ─────────────────────────────  │    ─────────────────────  │
│  ▼ frontend-design              │    ☑ Antigravity          │
│    创建前端界面的技能           │    ☐ Claude Code          │
│    📁 打开目录                  │    ☐ Gemini CLI           │
│                                 │                           │
│  ▶ pdf                          │                           │
│    已部署: Antigravity          │                           │
│                                 │                           │
│  ▶ docx                         │                           │
│    已部署: Antigravity, Claude  │                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## IPC 接口

| Channel | Direction | 参数 | 返回值 |
|---------|-----------|------|--------|
| `repo:list` | R → M | - | `SkillRepo[]` |
| `repo:clone` | R → M | `url: string` | `SkillRepo` |
| `repo:pull` | R → M | `id: string` | `void` |
| `repo:delete` | R → M | `id: string` | `void` |
| `repo:check-update` | R → M | `id: string` | `UpdateCheckResult` |
| `repo:check-all-updates` | R → M | - | `UpdateCheckResult[]` |
| `skill:list` | R → M | `repoId: string` | `Skill[]` |
| `skill:link` | R → M | `skillId: string, platformId: string` | `void` |
| `skill:unlink` | R → M | `skillId: string, platformId: string` | `void` |
| `skill:read-md` | R → M | `skillId: string` | `string` |
