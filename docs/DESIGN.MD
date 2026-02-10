# Agent Context Manager (ACM)

AI Agent Context (Skills/Rules) 管理工具

## 目标功能

1. 支持从各个 git repo 中拉取 skills
2. 支持将 skills 软链到各个 AI Agent的技能目录中
3. 支持用户编辑全局 rules
4. 支持用户将 rules 软链到各个 AI Agent的 AGENT 目录中

## 具体需求

1. 可视化界面，基于 Electron 实现跨平台（MAC/WIN/LINUX)
2. 编译打包基于 github action 自动实现
   1. 没有苹果开发者账号，需要 readme.md 提示用户通过特定手段绕过苹果的检测
   2. 每次master分支加上v开头的标签执行打包
3. 界面功能
   1. 启动
      1. 检查是否有 git，没有则提示安装
      2. 指定 Manager Base Dir, 后续所有下载的 skills 都放在这个目录下
   2. 主界面
      1. 三个标签切换
         1. AI Agent
         2. skills
         3. rules
      2. AI Agent
         1. 支持用户创建 AI Agent，指定名称， skills 目录和 rules 文件地址，提供一系列预设供用户快速设置(opencode / claude code / gemini cli / codex / antigravity / qoder / trae 等平台的全局路径和项目路径)
         2. 列表显示所有 AI Agent，每个 AI Agent显示
            1. 名称
            2. skills 目录（点击跳转到具体文件夹）
            3. rules 文件（点击打开文件）
            4. 状态（是否已启用）
            5. 操作按钮（删除）
      3. Skills 管理
         1. 支持用户填写指定的 git repo 地址(github 地址支持只填入 repo 名称，自动补全 <https://github.com/)，然后从地址拉取到> Manager Base Dir 下的对应 skills/<repo_name> 文件夹中
         2. 列表显示所有 git repo，每个 git repo 显示
            1. 名称
            2. repo 名称（网络地址，点击跳转到 repo）
            3. 本地地址（点击跳转到本地文件夹）
            4. 操作按钮（详情/查看）
         3. 详情页:
            1. 左侧显示 skill 列表
               1. 点击展开折叠，查看 SKILL.MD
               2. skill 名称
               3. repo 名称（网络地址，点击跳转到 repo）
               4. skill 本地地址（点击跳转到本地文件夹）
               5. 已经启用的 AI Agent列表
            2. 右侧有 AI Agent Switch 列表，默认勾选当前选中 skill 启用的 AI Agent，可以通过勾选/取消勾选来将选中 skill 启用/禁用 AI Agent
      4. rules 管理
         1. 支持用户创建 XXXX.md 文件，自动创建到 Manager Base Dir 下的对应 rules/ 文件夹中
         2. 列表显示所有 rules，每个 rule 显示
            1. 名称
            2. 本地地址（点击跳转到本地文件夹）
            3. 已经启用的 AI Agent列表
            4. 操作按钮（删除/查看）
         3. 查看
            1. 左侧为 XXXX.md 的内容
            2. 右侧有 AI Agent Switch 列表，默认勾选当前选中 rule 启用的 AI Agent，可以通过勾选/取消勾选来将选中 rule 启用/禁用 AI Agent

## 技术实现方案

### 1. Windows 管理员权限自动提升

Windows 创建符号链接需要管理员权限，采用以下方案：

1. **启动时检测权限**：通过 `is-elevated` 库检测当前是否具有管理员权限
2. **自动权限提升**：使用 `electron-sudo` 或 manifest 清单文件实现 UAC 提权
3. **优雅降级**：若用户拒绝提权，提示用户手动开启「开发者模式」作为替代方案

```xml
<!-- app.manifest (Windows) -->
<requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>
```

### 2. 配置文件方案

采用 **YAML** 格式，实施 **分层存储策略**。

#### 层级 1: 系统配置 (System Config)

* **位置**: `%APPDATA%/AgentContextManager/config.yaml` (Windows)
* **内容**:
  * `baseDir`: 用户数据存储目录
  * `language`: 界面语言
  * `theme`: 界面主题
  * `presets`: 自定义 Agent 预设

#### 层级 2: 用户配置 (User Config)

* **位置**: `<Manager Base Dir>/config/`
* **文件**:
    1. `ai-agent.yaml`: 定义 AI Agent 实例及其关联的 Skills/Rules
    2. `skills.yaml`: 定义 Skills Git 仓库源元数据
    3. `rules.yaml`: 定义 Rules 文件元数据
* **特性**:
  * **头部注释**: 自动注入详细字段说明，方便用户手动编辑
  * **可移植**: 随 Base Dir 移动

#### config/ai-agent.yaml 示例

```yaml
# ===================================================================
# AI AGENT CONFIGURATION
# 定义 AI Agent 实例
# ===================================================================

agents:
  - id: "uuid-1"
    name: "Antigravity"
    platform: "vscode"
    enabled: true
    skills:
      - "frontend-design"
    rules:
      - "global-standards"
```
