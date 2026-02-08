# 主界面布局设计 (UI Layout)

## 概述

主界面采用顶部导航布局，分为**左侧导航区**和**右侧功能区**。

## 顶部导航栏 (Top Navigation Bar)

### 左侧：主要导航

- **Tabs 标签页**:
  - **AI AGENT**: 管理 AI Agents（平台）。
  - **SKILLS**: 管理 Skill 仓库和具体技能。
  - **RULES**: 管理 Rule 文件和部署。

### 右侧：全局设置

- **设置按钮 (Settings)**: 打开设置弹窗/抽屉。

## 设置弹窗/抽屉 (Settings Modal/Drawer)

设置区域提供全局配置和应用信息。

### 配置 (Configuration)

- **基础目录 (Base URL)**: 显示当前 Base Dir。支持**重置/更改** Base Dir。
- **主题 (Theme)**: 切换 亮色 (Light) / 暗色 (Dark) / 跟随系统 (System)。
- **语言 (Language)**: 切换 中文 (zh-CN) / 英文 (en-US)。

### 关于 (About)

- **版本 (Version)**: 显示当前应用版本号 (读取 `package.json`)。
- **链接 (Links)**:
  - **GitHub**: 项目仓库链接。
  - **下载 (Download)**: 发布/下载页面链接。

## 布局结构 (React)

```tsx
<Layout>
  <Header>
    <div className="nav-left">
      <Tabs>
        <Tab>AI AGENT</Tab>
        <Tab>SKILLS</Tab>
        <Tab>RULES</Tab>
      </Tabs>
    </div>
    <div className="nav-right">
      <Button icon={<IconSettings />} onClick={openSettings} />
    </div>
  </Header>
  <Content>
    <Outlet /> {/* Router View */}
  </Content>
  {/* 状态栏已移除或集成到 Header/Settings */}
</Layout>
```

## 实现任务 (Implementation Tasks)

- [ ] **主布局组件 (Main Layout Component)**
  - [ ] 实现顶部 Header (Flexbox 左右布局)。
  - [ ] 集成 Arco Design Tabs 进行导航。
  - [ ] 顶部导航栏右侧设置按钮。
- [ ] **设置弹窗组件 (Settings Modal Component)**
  - [ ] 系统配置表单 (主题, 语言)。
  - [ ] Base Dir 管理 (复用启动向导逻辑或新增 IPC)。
  - [ ] 关于部分 (版本, 链接)。
