# Agent Context Manager (ACM)

跨平台 AI Agent 上下文 (Skills/Rules) 管理工具，支持 Windows / macOS / Linux。

## 功能特性

- 🔗 从 Git 仓库拉取 Skills 并软链到各 AI Agent
- 📝 统一管理全局 Rules 并同步到多个 AI Agent
- 🎯 支持多种 AI Agent预设（Antigravity, Claude Code, OpenCode 等）

## 安装指南

### Windows

1. 下载 `AgentContextManager-x.x.x-win.exe`
2. 双击运行安装程序
3. 首次启动时会请求**管理员权限**（创建符号链接所需）
   - 如拒绝授权，请手动开启「开发者模式」：
     - 设置 → 更新和安全 → 开发者选项 → 开启「开发人员模式」

### macOS

> [!IMPORTANT]
> 本应用未经 Apple 签名，需手动允许运行。

1. 下载 `AgentContextManager-x.x.x-mac.dmg`
2. 打开 DMG 并拖拽到 Applications 文件夹
3. **首次运行前**，执行以下任一操作：

#### 方式一：终端命令（推荐）

```bash
xattr -cr /Applications/AgentContextManager.app
```

#### 方式二：系统偏好设置

1. 尝试打开应用（会被阻止）
2. 打开「系统偏好设置」→「安全性与隐私」→「通用」
3. 点击「仍要打开」按钮

### Linux

1. 下载 `AgentContextManager-x.x.x-linux.AppImage`
2. 添加执行权限：

   ```bash
   chmod +x AgentContextManager-x.x.x-linux.AppImage
   ```

3. 运行应用

## 配置文件

本工具采用 **分层存储策略**：

1. **系统配置**：`%APPDATA%/AgentContextManager/config.yaml`
    - 存储 Base Dir 路径、语言、主题等。
2. **用户数据**：`<Manager Base Dir>/config/`
    - `ai-agent.yaml`: Agent 实例与 Skills/Rules 关联
    - `skills.yaml`: Skill 仓库源
    - `rules.yaml`: Rule 文件元数据

详见 [配置系统设计](./docs/design/05_config.md) 获取完整说明。

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build
```

## License

MIT
