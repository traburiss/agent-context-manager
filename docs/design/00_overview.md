# Agent Context Manager 详细设计

## 项目概述

Agent Context Manager 是一个跨平台的 AI Agent 上下文 (Skills/Rules) 管理工具，基于 Electron 实现，支持 Windows/macOS/Linux。

## 技术架构

```text
┌─────────────────────────────────────────────────────────────┐
│                        Renderer Process                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Platform   │  │   Skills    │  │   Rules     │          │
│  │    Tab      │  │    Tab      │  │    Tab      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                           │                                  │
│                    [IPC Channel]                             │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                     Main Process                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Config     │  │    Git      │  │  Symlink    │          │
│  │  Service    │  │  Service    │  │  Service    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                           │                                  │
│                    [File System]                             │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   <Manager Base Dir>                  │   │
│  │  config/  │  skills/  │  rules/                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 框架 | Electron 33+ |
| 前端 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7 + electron-builder |
| UI 组件 | Arco Design 2.66 |
| 样式 | Tailwind CSS v4 |
| 状态 | Zustand |
| Git 操作 | simple-git |
| 配置 | js-yaml |

## 目录结构

```text
SkillsManager/
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── index.ts          # 入口
│   │   ├── services/         # 业务服务
│   │   │   ├── config.ts     # 配置服务
│   │   │   ├── git.ts        # Git 操作服务
│   │   │   ├── symlink.ts    # 符号链接服务
│   │   │   └── platform.ts   # AI Agent检测服务
│   │   └── ipc/              # IPC 处理器
│   ├── renderer/             # React 前端
│   │   ├── App.tsx
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # 通用组件
│   │   ├── stores/           # Zustand 状态
│   │   └── hooks/            # 自定义 Hooks
│   └── shared/               # 共享类型定义
│       └── types.ts
├── resources/                # 静态资源
│   └── presets/              # 内置AI Agent预设
├── docs/                     # 文档
│   ├── DESIGN.MD
│   └── design/               # 详细设计
└── electron-builder.yml      # 打包配置
```

## 详细设计文档索引

| 文档 | 描述 |
|------|------|
| [01_startup.md](./01_startup.md) | 启动流程与初始化 |
| [02_platform.md](./02_platform.md) | AI Agent管理 |
| [03_skills.md](./03_skills.md) | Skills 管理 |
| [04_rules.md](./04_rules.md) | Rules 管理 |
| [05_config.md](./05_config.md) | 配置系统 |
| [06_cicd.md](./06_cicd.md) | CI/CD 构建 |
| [07_ui_layout.md](./07_ui_layout.md) | 主界面布局 |
