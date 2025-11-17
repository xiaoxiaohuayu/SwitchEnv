# SwitchEnv

一个类似 SwitchHosts 的环境变量管理工具，帮助开发者快速切换不同的环境配置。

## 功能特点

- 🔄 **快速切换**: 一键切换不同的环境变量配置
- 🖥️ **系统扫描**: 启动时自动扫描本机环境变量，支持导入
- 📁 **多格式支持**: 支持 JSON 和 .env 格式的导入导出
- 🎨 **现代化界面**: 基于 Vue 3 + Element Plus 的美观界面
- 🔒 **本地存储**: 所有配置安全地存储在本地
- ⚡ **快捷模板**: 内置常用开发环境模板
- 🖥️ **跨平台**: 支持 Windows、macOS 和 Linux

## 技术栈

- **前端**: Vue 3 + TypeScript + Element Plus + Pinia
- **后端**: Electron + Node.js
- **构建**: electron-vite

## 安装和运行

### 开发环境

1. 克隆项目
```bash
git clone <repository-url>
cd SwitchEnv
```

2. 安装依赖
```bash
pnpm install
```

3. 启动开发服务器
```bash
pnpm dev
```

**注意**: 如果遇到 Electron 安装问题，请运行：
```bash
cd node_modules\.pnpm\electron@*\node_modules\electron && node install.js
```

### 生产构建

1. 构建应用
```bash
pnpm build
```

2. 打包分发版本
```bash
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## 快速开始

请查看 [QUICKSTART.md](./QUICKSTART.md) 获取详细的使用指南和示例。

## 功能详情

请查看 [FEATURES.md](./FEATURES.md) 获取完整的功能说明和技术架构。

## 使用指南

### 查看系统环境变量

1. 点击标题栏右侧的“系统环境变量”按钮
2. 查看本机所有环境变量
3. 可以搜索、导入单个或全部导入

### 创建环境配置

1. 点击"新建配置"按钮
2. 输入配置名称（如：开发环境、测试环境）
3. 添加环境变量：
   - 点击"添加变量"按钮
   - 输入变量名和变量值
   - 可以使用快捷模板快速添加常用变量

### 切换环境

1. 在左侧列表中选择要使用的配置
2. 点击"启用此配置"按钮
3. 当前使用的配置会显示绿色标记

### 导入配置

支持两种导入方式：
- **JSON 文件**: 完整的配置信息
- **.env 文件**: 标准的环境变量文件

### 导出配置

可以将配置导出为：
- **JSON 文件**: 包含完整配置信息
- **.env 文件**: 标准 .env 格式

## 快捷模板

内置以下快捷模板：

- **Node.js**: NODE_ENV, PORT, DEBUG 等
- **React**: REACT_APP_* 相关变量
- **Vue**: VUE_APP_* 相关变量
- **Database**: 数据库连接配置
- **API**: API 相关配置

## 数据存储

- 配置文件存储在用户数据目录
- 环境变量会写入到 `.env` 文件中
- 所有数据仅保存在本地，确保隐私安全

## 开发说明

### 项目结构

```
src/
├── main/               # Electron 主进程
│   ├── index.ts        # 主进程入口
│   ├── preload.ts      # 预加载脚本
│   └── services/       # 服务层
└── renderer/           # 渲染进程（Vue 应用）
    ├── App.vue         # 主应用组件
    ├── main.ts         # 渲染进程入口
    ├── components/     # Vue 组件
    └── stores/         # Pinia 状态管理
```

### 主要组件

- **App.vue**: 主应用界面
- **ProfileDialog.vue**: 创建/编辑配置对话框
- **EnvironmentManager**: 环境变量管理服务

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！