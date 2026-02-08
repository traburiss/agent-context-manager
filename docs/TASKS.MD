# Agent Context Manager 开发任务计划

## Phase 1: 项目初始化 ✅

- [x] 使用 Vite + Electron 模板初始化项目
- [x] 配置 TypeScript 5.9 严格模式
- [x] 配置 Tailwind CSS v4
- [x] 配置 ESLint + Prettier
- [x] 创建基础目录结构

## Phase 2: 核心服务层 `[/]`

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

### 2.2 AI Agent服务 (PlatformService) `[/]`

> 参考: [Design 02_platform](docs/design/02_platform.md)

- [x] 初始 `PlatformService` 实现 (Old)
- [ ] **重构：适配 `ConfigService`**
  - [ ] `list()`: 从 `ConfigService.getUserConfig().agents` 读取
  - [ ] `create/update/delete`: 调用 `ConfigService.setUserConfig` 更新 `.agents` 数组
  - [ ] 移除旧的文件系统 (`platforms/*.yaml`) 读取逻辑
- [ ] **实现预设 (Presets) 逻辑**
  - [ ] 加载内置 `resources/presets`
  - [ ] 实现 `getPresets()` 方法

### 2.3 Skills 服务 (SkillService & GitService) `[/]`

> 参考: [Design 03_skills](docs/design/03_skills.md)

- [x] 初始 `GitService` 实现 (Old)
- [ ] **重构：SkillRepo 管理**
  - [ ] `GitService`: 负责 clone/pull/check-update
  - [ ] 仓库元数据存储于 `ConfigService.getUserConfig().skills`
- [ ] **实现 Skill 扫描逻辑**
  - [ ] 创建 `SkillService`
  - [ ] 实现 `scanSkills(repoPath)`: 递归查找 `SKILL.MD`
  - [ ] 解析 `SKILL.MD` 提取描述信息

### 2.4 Rules 服务 (RuleService) `[/]`

> 参考: [Design 04_rules](docs/design/04_rules.md)

- [x] 初始 `RuleService` 实现 (Old)
- [ ] **重构：适配 `ConfigService`**
  - [ ] `list()`: 从 `ConfigService.getUserConfig().rules` 读取
  - [ ] `create/delete`: 更新配置中的 Rules 列表
  - [ ] 保持 `.md` 文件存储在 `rules/` 目录下
- [ ] **实现 Rule 部署逻辑 (RuleDeployService)**
  - [ ] 实现标记生成 `<!-- SKILLS_MANAGER_RULE_START:id -->`
  - [ ] 实现 `deploy`: 读取目标文件 -> 清理旧内容 -> 注入新内容 -> 保存
  - [ ] 实现 `undeploy`: 清理标记内容

### 2.5 符号链接服务 (SymlinkService) ✅

- [x] 实现 `SymlinkService` 类
- [x] Windows junction 创建/删除
- [x] 权限检测与提示

## Phase 3: IPC 通信层 `[/]`

- [x] 定义 IPC Channel 常量
- [ ] **完善 Main 进程 IPC 处理器**
  - [x] Config IPC (`config:*`)
  - [ ] Platform IPC (`platform:*`)
  - [ ] Skills/Repo IPC (`repo:*`, `skill:*`)
  - [ ] Rule IPC (`rule:*`)
- [ ] **完善 Renderer 进程 IPC 客户端**
  - [x] `window.api` 类型定义
  - [ ] 补全所有设计文档中定义的接口

## Phase 4: 前端界面 `[/]`

### 4.1 启动流程 ✅

> 参考: [Design 01_startup](docs/design/01_startup.md)

- [x] Git 环境检测
- [x] 初始化向导 (Base Dir 选择)
- [x] 国际化 (i18n) 支持

### 4.2 主界面框架

- [ ] **Layout 组件**
  - [ ] 顶部导航栏 (Logo + Tabs)
  - [ ] 底部状态栏 (版本信息)
- [ ] **全局状态 (useStore)**
  - [ ] 集成 Platform, Skills, Rules 状态

### 4.3 AI Agent管理 (Agents Tab)

> 参考: [Design 02_platform](docs/design/02_platform.md)

- [ ] **Agent 列表视图**
  - [ ] 展示 Agent 卡片 (包含 Skills/Rules 路径状态)
  - [ ] 绑定/解绑 Skills 概览
- [ ] **新建 Agent 对话框**
  - [ ] 预设选择器 (Tab: 预设 / 自定义)
  - [ ] 表单验证

### 4.4 Skills 管理 (Skills Tab)

> 参考: [Design 03_skills](docs/design/03_skills.md)

- [ ] **仓库列表视图**
  - [ ] 展示已添加的 Skill Repos
  - [ ] 状态指示器 (Up-to-date, Behind, Confirming)
  - [ ] 操作按钮: 更新, 删除, 详情
- [ ] **添加仓库对话框**
  - [ ] 输入 URL / 选择本地路径
- [ ] **Skill 详情/部署页**
  - [ ] 展示仓库内扫描到的 Skills
  - [ ] 部署矩阵: Skill x Agent (Checkbox)
  - [ ] 触发 `skill:link` / `skill:unlink`

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
  - [ ] ConfigService (Done)
  - [ ] PlatformService
  - [ ] SkillService
  - [ ] RuleService / RuleDeployService
- [ ] **文档**
  - [ ] 用户手册 (README.md)
  - [ ] 开发贡献指南

## 里程碑

| 阶段 | 状态 | 交付物 |
|------|------|--------|
| Phase 1 | ✅ 完成 | 项目骨架 |
| Phase 2 | 🚧 进行中 | 核心服务 (分离存储重构) |
| Phase 3 | ⏳ 等待 | IPC 通信 |
| Phase 4 | ⏳ 等待 | 完整界面 |
| Phase 5 | ⏳ 等待 | 自动构建 |
| Phase 6 | ⏳ 等待 | 测试文档 |
