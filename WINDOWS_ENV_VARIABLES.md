# Windows 环境变量全面支持

## 功能概述

SwitchEnv 现在全面支持 Windows 环境变量的区分和管理,能够清楚地区分:

- **系统变量** (System Variables) - 存储在注册表 `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment`
- **用户变量** (User Variables) - 存储在注册表 `HKEY_CURRENT_USER\Environment`  
- **进程变量** (Process Variables) - 仅在当前进程中存在的临时变量

## 新增功能

### 1. Windows 环境变量分类查看

打开"系统环境变量"对话框后,你将看到四个标签页:

- **系统变量**: 显示所有系统级环境变量(需要管理员权限修改)
- **用户变量**: 显示当前用户的环境变量
- **进程变量**: 显示仅在当前进程中的临时变量
- **全部变量**: 显示所有变量,并带有作用域标签

### 2. 作用域标识

每个环境变量都会标明其作用域:
- 🔴 **系统** - 系统级变量,影响所有用户
- 🔵 **用户** - 用户级变量,仅影响当前用户
- ⚪ **进程** - 临时变量,仅在当前进程有效

### 3. 分类导入

你可以选择性地导入:
- 只导入系统变量
- 只导入用户变量
- 只导入进程变量
- 导入全部变量

每次导入会创建一个新的配置,配置名称会自动标明来源(如"系统环境变量"、"用户环境变量")。

## 使用方法

### 查看 Windows 环境变量

1. 启动 SwitchEnv 应用
2. 点击顶部菜单或使用快捷键打开"系统环境变量"对话框
3. 切换标签页查看不同作用域的变量

### 导入环境变量

**方式一:批量导入**
1. 选择要导入的标签页(系统/用户/进程/全部)
2. 点击"导入全部到新配置"按钮
3. 将创建一个包含所选作用域所有变量的新配置

**方式二:单个导入**
1. 找到想要导入的变量
2. 点击该变量行的"导入"按钮
3. 该变量将添加到当前选中的配置中

### 搜索和过滤

- 使用搜索框可以快速查找特定的环境变量
- 支持按变量名和变量值搜索
- 每个标签页的搜索是独立的

## 技术实现

### 数据获取

应用通过 PowerShell 命令获取 Windows 环境变量:

```powershell
# 获取系统变量
[Environment]::GetEnvironmentVariables('Machine')

# 获取用户变量
[Environment]::GetEnvironmentVariables('User')
```

### 数据结构

```typescript
interface EnvVariable {
  key: string
  value: string
  scope?: 'system' | 'user' | 'process' // 作用域标识
}
```

### API 接口

```typescript
// 获取 Windows 环境变量(区分作用域)
window.api.getWindowsEnv(): Promise<{
  system: EnvVariable[]    // 系统变量
  user: EnvVariable[]      // 用户变量
  process: EnvVariable[]   // 进程变量
}>
```

## 注意事项

### 权限问题

- **读取**: 所有作用域的变量都可以正常读取
- **写入**: 修改系统变量需要管理员权限

### 环境变量生效

- 通过 SwitchEnv 修改的变量仅在应用内生效
- 要永久修改 Windows 环境变量,需要:
  1. 使用 Windows 系统设置
  2. 或使用"将当前配置写入文件"功能写入 PowerShell Profile

### 性能

- 首次加载会执行 PowerShell 命令,可能需要 1-2 秒
- 后续切换标签页无需重新加载
- 支持"刷新"按钮重新获取最新数据

## 常见问题

### Q: 为什么看不到某些系统变量?

A: 某些系统变量可能需要管理员权限才能查看,请尝试以管理员身份运行 SwitchEnv。

### Q: 如何永久修改 Windows 环境变量?

A: SwitchEnv 主要用于快速切换开发环境,不直接修改系统注册表。如需永久修改:
1. 使用 Windows 系统设置
2. 或将配置写入 PowerShell Profile

### Q: 进程变量是什么?

A: 进程变量是在应用启动时由系统或其他程序设置的临时变量,它们不存储在注册表中,仅在当前进程生命周期内有效。

### Q: 导入后配置能否正常工作?

A: 完全可以!导入的配置与手动创建的配置功能完全相同,可以正常切换和使用。

## 更新日志

### v1.1.0 (2025-11-22)

- ✨ 新增 Windows 环境变量分类查看功能
- ✨ 支持区分系统变量、用户变量和进程变量
- ✨ 新增作用域标签显示
- ✨ 新增分类导入功能
- ✨ 优化环境变量对话框 UI
- 🐛 修复 Windows 配置文件列表空白问题
- 🐛 修复环境变量数量显示不准确问题

## 相关文档

- [HOW_TO_USE_SYSTEM_ENV.md](./HOW_TO_USE_SYSTEM_ENV.md) - 系统环境变量使用指南
- [SYSTEM_ENV_FEATURE.md](./SYSTEM_ENV_FEATURE.md) - 系统环境功能详解
- [README.md](./README.md) - 项目主文档
