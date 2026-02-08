# 配置系统设计

## 1. 概述

本系统采用 **YAML** 格式进行配置管理，实施 **分层存储策略**，将系统引导配置与用户业务数据分离。

## 2. 存储架构

### 层级 1: 系统配置 (System Config)

* **位置**: `[AppData]/AgentContextManager/config.yaml`
* **用途**: 引导应用启动，存储全局环境设置。
* **特性**: 变更频率低，由应用自动维护。

### 层级 2: 用户配置 (User Config)

* **位置**: `[BaseDir]/config/` (BaseDir 由系统配置指定)
* **用途**: 存储 AI Agent、Skills、Rules 的业务定义与关联关系。
* **特性**:
  * 变更频率高。
  * **可移植**: 整个 BaseDir 文件夹可直接复制/Git同步到其他机器。
  * **可读性**: 文件头部包含详细注释，支持用户手动编辑。

## 3. 文件结构详解

### 3.1 系统配置文件

**路径**: `%APPDATA%/AgentContextManager/config.yaml`

```yaml
# ===================================================================
# SYSTEM CONFIGURATION
# 系统引导配置
# ===================================================================

# [baseDir]
# 核心数据存储目录 (Agents, Skills, Rules)
# 修改此路径会将应用上下文切换到新的数据仓库
baseDir: "D:\\AI_Context_Library"

# [language]
# 界面语言 (zh-CN / en-US)
language: "zh-CN"

# [theme]
# 界面主题 (light / dark / system)
theme: "system"

# [presets]
# 自定义 Agent 预设模板（除了内置模板外的用户自定义模板）
presets: []
```

### 3.2 用户业务配置文件

所有文件均位于 `[BaseDir]/config/` 目录下。

#### A. Agent 配置 (`ai-agent.yaml`)

定义所有 AI Agent 实例及其启用的技能与规则。

```yaml
# ===================================================================
# AI AGENT CONFIGURATION
# 定义 AI Agent 实例
#
# 字段说明:
# - id: 唯一标识符 (UUID)
# - name: 显示名称
# - platform: 所属平台 (对应 presets 中的 key)
# - enabled: 是否启用
# - skills: 启用的 Skill 名称列表
# - rules: 启用的 Rule 名称列表
# - paths: (可选) 覆盖默认的生成路径
# ===================================================================

agents:
  - id: "unique-uuid-1"
    name: "My Work Coder"
    platform: "vscode"
    enabled: true
    skills:
      - "frontend-design"
      - "python-utils"
    rules:
      - "company-standards"
    paths:
      skills_dir: "${HOME}/.vscode/skills"
```

#### B. Skills 配置 (`skills.yaml`)

定义已下载/管理的 Skill 仓库信息。

```yaml
# ===================================================================
# SKILLS CONFIGURATION
# 管理 Skill 仓库源
#
# 字段说明:
# - name: Skill 名称 (文件夹名)
# - remote: Git 仓库地址
# - branch: 分支 (默认 main/master)
# - lastUpdate: 最后更新时间
# ===================================================================

skills:
  - name: "frontend-design"
    remote: "https://github.com/awesome-skills/frontend-design.git"
    branch: "main"
```

#### C. Rules 配置 (`rules.yaml`)

定义 Rules 文件元数据。

```yaml
# ===================================================================
# RULES CONFIGURATION
# 管理 Rule 文件
#
# 字段说明:
# - name: Rule 名称 (文件名无后缀)
# - description: 描述信息
# ===================================================================

rules:
  - name: "company-standards"
    description: "公司统一编码规范"
```

## 4. 读写策略

### 4.1 内存优先 (Memory-First)

为保证 UI 响应速度，所有配置读取与更新遵循以下流程：

1. **启动加载**: 应用启动时，一次性读取所有 YAML 文件并在内存中构建完整状态树。
2. **同步更新**: 前端发起修改请求 ->虽然 -> 主进程立即更新内存对象 -> 立即返回成功。
3. **异步持久化**: 内存更新后，触发去抖动 (Debounce 500ms) 的磁盘写入操作。

### 4.2 写入安全

* **原子写入**: 使用 `Write to Temp` -> `Rename` 策略，防止写入过程中断电导致文件损坏。
* **头部注入**: 每次写入文件时，程序自动在文件头部注入标准注释块（Header Comments），确保手写配置的可读性不丢失。

## 5. 框架实现支持

* **Electron**: 提供主进程文件系统访问能力。
* **js-yaml**: 负责 YAML 序列化与反序列化。
* **Lodash**: 提供 `debounce` 函数实现写入去抖。
* **fs-extra**: 提供 `ensureDir`, `atomic write` 等文件操作便利性。
