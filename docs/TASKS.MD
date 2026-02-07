# Agent Context Manager 开发任务计划

## Phase 1: 项目初始化 ✅

- [x] 使用 Vite + Electron 模板初始化项目
- [x] 配置 TypeScript 5.9 严格模式
- [x] 配置 Tailwind CSS v4
- [x] 配置 ESLint + Prettier
- [x] 创建基础目录结构

## Phase 2: 核心服务层 ✅

### 2.1 配置服务 ✅

- [x] 实现 `ConfigService` 类
- [x] YAML 配置读写
- [x] 环境变量解析
- [x] 内置预设加载

### 2.2 AI Agent服务 ✅

- [x] 实现 `PlatformService` 类
- [x] AI Agent CRUD 操作
- [x] 路径变量替换

### 2.3 Git 服务 ✅

- [x] 实现 `GitService` 类
- [x] Git 检测
- [x] 仓库克隆/拉取
- [x] URL 规范化
- [x] 更新检查 (`checkForUpdates`/`checkAllUpdates`)

### 2.4 符号链接服务 ✅

- [x] 实现 `SymlinkService` 类
- [x] Windows junction 创建
- [x] 权限检测与提示

### 2.5 Rules 服务 ✅

- [x] 实现 `RuleService` 类
- [x] 实现 `RuleDeployService` 类
- [x] 内容合并策略

## Phase 3: IPC 通信层 ✅

- [x] 定义 IPC Channel 常量
- [x] 实现 Main 进程 IPC 处理器
- [x] 实现 Renderer 进程 IPC 客户端
- [x] 类型安全的 IPC 封装

## Phase 4: 前端界面

### 4.1 启动流程

- [ ] 权限检测页面
- [ ] Git 检测页面
- [ ] 初始化向导

### 4.2 主界面框架

- [ ] Tab 导航组件
- [ ] 全局状态管理 (Zustand)

### 4.3 AI Agent管理

- [ ] AI Agent列表页
- [ ] 添加AI Agent对话框
- [ ] 预设选择器

### 4.4 Skills 管理

- [ ] 仓库列表页
- [ ] 添加仓库对话框
- [ ] 仓库详情页
- [ ] Skill 列表组件
- [ ] AI Agent部署开关

### 4.5 Rules 管理

- [ ] Rules 列表页
- [ ] 新建 Rule 对话框
- [ ] Rule 编辑页
- [ ] Markdown 编辑器
- [ ] AI Agent部署开关

## Phase 5: CI/CD

- [ ] 创建 GitHub Actions 工作流
- [ ] 配置 electron-builder
- [ ] Windows 签名配置
- [ ] 自动发布 Release

## Phase 6: 测试与文档

- [ ] 单元测试 (Vitest)
- [ ] E2E 测试 (Playwright)
- [ ] 完善 README.md
- [ ] 用户使用文档

## 里程碑

| 阶段 | 预计工期 | 交付物 |
|------|---------|--------|
| Phase 1 | 1 天 | 项目骨架 |
| Phase 2 | 3 天 | 核心服务 |
| Phase 3 | 1 天 | IPC 通信 |
| Phase 4 | 5 天 | 完整界面 |
| Phase 5 | 1 天 | 自动构建 |
| Phase 6 | 2 天 | 测试文档 |
| **总计** | **~13 天** | 可发布版本 |
