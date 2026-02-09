# Agent Context Manager 开发任务计划

## Phase 1: 项目初始化 ✅

- [x] 使用 Vite + Electron 模板初始化项目
- [x] 配置 TypeScript 5.9 严格模式
- [x] 配置 Tailwind CSS v4
- [x] 配置 ESLint + Prettier
- [x] 创建基础目录结构

## Phase 2: 核心服务层 ✅

> [!NOTE]
> 核心服务正在根据 [Design 05_config](docs/design/05_config.md) 的**分层存储方案**进行重构。

### 2.1 配置服务 (ConfigService) ✅

- [x] **初始 ConfigService 实现**
- [x] **重构：实现分层配置逻辑**
  - [x] `SystemConfig` (App Data) 与 `UserConfig` (Base Dir) 分离
  - [x] 异步去抖 (Debounce) 持久化
  - [x] 配置文件头部注释注入
- [x] **实现启动流程支持**
  - [x] `checkGitInstalled`
  - [x] `resolveVariables` (${HOME}, ${APPDATA} 等)
- [x] **配置迁移**
  - [x] 迁移至 `~/.config/acm/config.yaml`
  - [x] 预设 (Presets) 存入系统配置

### 2.2 AI Agent服务 (PlatformService) ✅

> 参考: [Design 02_platform](docs/design/02_platform.md)

- [x] 初始 `PlatformService` 实现 (Old)
- [x] **重构：适配 `ConfigService`**
  - [x] `list()`: 从 `ConfigService.getUserConfig().agents` 读取
  - [x] `create/update/delete`: 调用 `ConfigService.setUserConfig` 更新 `.agents` 数组
  - [x] 移除旧的文件系统 (`platforms/*.yaml`) 读取逻辑
- [x] **实现预设 (Presets) 逻辑**
  - [x] 加载内置 `resources/presets`
  - [x] 实现 `getPresets()` 方法 (Moved to ConfigService)

### 2.3 Skills 服务 (SkillService & GitService) ✅

> 参考: [Design 03_skills](docs/design/03_skills.md)

- [x] 初始 `GitService` 实现 (Old)
- [x] **重构：SkillRepo 管理**
  - [x] `GitService`: 负责 clone/pull/check-update
  - [x] 仓库元数据存储于 `ConfigService.getUserConfig().skills`
- [x] **实现 Skill 扫描逻辑**
  - [x] 创建 `SkillService`
  - [x] 实现 `scanSkills(repoPath)`: 递归查找 `SKILL.MD`
  - [x] 解析 `SKILL.MD` 提取描述信息

### 2.4 Rules 服务 (RuleService) ✅

> 参考: [Design 04_rules](docs/design/04_rules.md)

- [x] 初始 `RuleService` 实现 (Old)
- [x] **重构：适配 `ConfigService`**
  - [x] `list()`: 从 `ConfigService.getUserConfig().rules` 读取
  - [x] `create/delete`: 更新配置中的 Rules 列表
  - [x] 保持 `.md` 文件存储在 `rules/` 目录下
- [x] **实现 Rule 部署逻辑 (RuleDeployService)**
  - [x] 实现标记生成 `<!-- SKILLS_MANAGER_RULE_START:id -->`
  - [x] 实现 `deploy`: 读取目标文件 -> 清理旧内容 -> 注入新内容 -> 保存
  - [x] 实现 `undeploy`: 清理标记内容

### 2.5 符号链接服务 (SymlinkService) ✅

- [x] 实现 `SymlinkService` 类
- [x] Windows junction 创建/删除
- [x] 权限检测与提示

## Phase 3: IPC 通信层 ✅

- [x] 定义 IPC Channel 常量
- [x] **完善 Main 进程 IPC 处理器**
  - [x] Config IPC (`config:*`)
  - [x] Platform IPC (`platform:*`)
  - [x] Skills/Repo IPC (`repo:*`, `skill:*`)
  - [x] Rule IPC (`rule:*`)
- [x] **完善 Renderer 进程 IPC 客户端**
  - [x] `window.api` 类型定义
  - [x] 补全所有设计文档中定义的接口

## Phase 4: 前端界面 `[/]`

### 4.1 启动流程 ✅

> 参考: [Design 01_startup](docs/design/01_startup.md)

- [x] Git 环境检测
- [x] 初始化向导 (Base Dir 选择)
- [x] 国际化 (i18n) 支持

### 4.2 主界面框架 ✅

> 参考: [Design 07_ui_layout](docs/design/07_ui_layout.md)

- [x] **Layout 组件**
  - [x] 顶部导航栏 (Header)
    - [x] 左侧: Tabs (AI AGENT | SKILLS | RULES)
    - [x] 右侧: 设置按钮
  - [x] 内容区域 (Content Outlet)
- [x] **设置 (Settings) 模块**
  - [x] 设置弹窗/抽屉组件
  - [x] **通用设置**
    - [x] Base Dir 重设/切换
    - [x] 主题切换 (Light/Dark/System)
    - [x] 语言切换 (zh-CN/en-US)
  - [x] **关于信息**
    - [x] 版本号显示
    - [x] GitHub 链接
    - [x] 下载页面链接
- [x] **全局状态 (useStore)**
  - [x] 集成 Platform, Skills, Rules 状态

### 4.3 AI Agent管理 (Agents Tab) ✅

> 参考: [Design 02_platform](docs/design/02_platform.md)

- [x] **Agent 列表视图**
  - [x] 展示 Agent 卡片 (包含 Skills/Rules 路径状态)
  - [x] 绑定/解绑 Skills 概览 (基础信息展示)
- [x] **新建 Agent 对话框**
  - [x] 预设选择器 (Tab: 预设 / 自定义)
  - [x] 表单验证

### 4.4 Skills 管理 (Skills Tab)

> 参考: [Design 03_skills](docs/design/03_skills.md)

- [x] **仓库列表视图**
  - [x] 展示已添加的 Skill Repos
  - [x] 状态指示器 (Up-to-date, Behind, Confirming)
  - [x] 操作按钮: 更新, 删除, 详情
- [x] **添加仓库对话框**
  - [x] 输入 URL / 选择本地路径
- [x] **Skill 详情/部署页**
  - [x] 展示仓库内扫描到的 Skills
  - [x] 部署矩阵: Skill x Agent (Checkbox)
  - [x] 触发 `skill:link` / `skill:unlink`

### 4.5 Rules 管理 (Rules Tab)

> 参考: [Design 04_rules](docs/design/04_rules.md)

- [ ] **Rules 列表视图**
  - [ ] 展示 Rule 文件列表
  - [ ] 部署状态概览
- [ ] **Rule 编辑器**
  - [ ] Markdown 编辑预览
  - [ ] 部署配置 (选择生效的 Agents)

## Phase 5: CI/CD

> 参考: [Design 06_cicd](docs/design/06_cicd.md)

- [ ] GitHub Actions 工作流配置
- [ ] electron-builder 配置 (Win/Mac/Linux)
- [ ] Release 自动发布

## Phase 6: 测试与文档

- [ ] **单元测试**
  - [x] ConfigService (Done)
  - [x] PlatformService (Done)
  - [x] SkillService (Done)
  - [x] RuleService / RuleDeployService (Done)
- [ ] **文档**
  - [ ] 用户手册 (README.md)
  - [ ] 开发贡献指南

## 里程碑

| 阶段 | 状态 | 交付物 |
| :--- | :--- | :--- |
| Phase 1 | ✅ 完成 | 项目骨架 |
| Phase 2 | ✅ 完成 | 核心服务 (分离存储重构) |
| Phase 3 | ✅ 完成 | IPC 通信 |
| Phase 4 | 🚧 进行中 | 完整界面 |
| Phase 5 | ⏳ 等待 | 自动构建 |
| Phase 6 | ⏳ 等待 | 测试文档 |
