# Windows 系统环境变量直接编辑功能

## 核心功能

SwitchEnv 现在支持**直接编辑 Windows 系统和用户环境变量**,无需通过系统设置界面!

### ✨ 主要特性

- ✅ **直接修改注册表** - 通过 PowerShell API 直接操作注册表
- ✅ **区分系统和用户变量** - 分别管理系统级和用户级环境变量
- ✅ **实时生效** - 修改后自动广播 WM_SETTINGCHANGE 消息
- ✅ **权限管理** - 系统变量需要管理员权限
- ✅ **增删改查** - 完整的 CRUD 操作
- ✅ **批量操作** - 支持批量设置环境变量
- ✅ **安全确认** - 所有操作都需要二次确认

## 使用方法

### 1. 打开环境变量管理器

1. 启动 SwitchEnv 应用
2. 点击"系统环境变量"按钮
3. 选择"系统变量"或"用户变量"标签页

### 2. 新增环境变量

**步骤:**
1. 点击"新增变量"按钮
2. 输入格式: `变量名=变量值`
   - 例如: `MY_API_KEY=abc123`
3. 点击确认
4. 系统自动保存到注册表

**示例:**
```
NODE_ENV=development
API_URL=https://api.example.com
MY_PATH=C:\MyTools\bin
```

### 3. 编辑环境变量

**步骤:**
1. 在变量列表中找到要编辑的变量
2. 点击该变量行的"编辑"按钮
3. 修改值
4. 点击保存
5. 立即生效!

**注意:**
- 只能修改变量值,不能修改变量名
- 如需修改变量名,请删除后重新创建

### 4. 删除环境变量

**步骤:**
1. 找到要删除的变量
2. 点击"删除"按钮
3. 二次确认
4. 从注册表中删除

⚠️ **警告:** 删除系统变量可能影响系统运行,请谨慎操作!

### 5. 导入到 SwitchEnv 配置

如果只是想在 SwitchEnv 中使用,不想修改系统变量:

1. 找到要导入的变量
2. 点击"导入"按钮
3. 变量添加到当前 SwitchEnv 配置中
4. 不会修改系统注册表

## 系统变量 vs 用户变量

### 系统变量 (System)

| 特性 | 说明 |
|------|------|
| 作用范围 | 所有用户 |
| 权限要求 | **需要管理员权限** |
| 存储位置 | `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment` |
| 典型用途 | Java_HOME, PATH(系统部分), SYSTEM_ROOT |

**修改系统变量需要:**
1. 以管理员身份运行 SwitchEnv
2. 或者在 UAC 提示时允许权限提升

### 用户变量 (User)

| 特性 | 说明 |
|------|------|
| 作用范围 | 仅当前用户 |
| 权限要求 | 无需管理员权限 |
| 存储位置 | `HKEY_CURRENT_USER\Environment` |
| 典型用途 | PATH(用户部分), 个人开发配置 |

**推荐:**
- 个人开发配置使用用户变量
- 全局系统配置使用系统变量

## 技术实现

### PowerShell API

**读取环境变量:**
```powershell
[Environment]::GetEnvironmentVariables('Machine')  # 系统变量
[Environment]::GetEnvironmentVariables('User')     # 用户变量
```

**设置环境变量:**
```powershell
[Environment]::SetEnvironmentVariable('KEY', 'VALUE', 'Machine')  # 系统
[Environment]::SetEnvironmentVariable('KEY', 'VALUE', 'User')     # 用户
```

**删除环境变量:**
```powershell
[Environment]::SetEnvironmentVariable('KEY', $null, 'Machine')
```

### 广播更改消息

修改后会发送 `WM_SETTINGCHANGE` 消息通知系统:

```typescript
// 通知所有窗口环境变量已更改
SendMessageTimeout(
  HWND_BROADCAST,
  WM_SETTINGCHANGE,
  0,
  "Environment",
  SMTO_ABORTIFHUNG,
  5000
)
```

这样新打开的程序就能立即看到更改!

## 使用场景

### 场景1: 添加工具到 PATH

**问题:** 安装了新工具,想全局可用

**解决:**
1. 打开系统环境变量管理器
2. 选择"用户变量"标签
3. 找到 `PATH` 变量
4. 点击"编辑"
5. 在末尾添加: `;C:\MyTool\bin`
6. 保存

**或者新增:**
1. 点击"新增变量"
2. 输入: `MY_TOOL_PATH=C:\MyTool\bin`
3. 保存

### 场景2: 设置开发环境

**问题:** 需要为不同项目设置不同的环境变量

**解决:**
1. 在用户变量中添加:
   ```
   NODE_ENV=development
   API_URL=http://localhost:3000
   DB_HOST=localhost
   ```
2. 这些变量全局生效
3. 或者只导入到 SwitchEnv 配置中,按需切换

### 场景3: 修改 Java_HOME

**问题:** 安装了新版本 JDK,需要更新 JAVA_HOME

**解决:**
1. 打开系统环境变量
2. 选择"系统变量"标签
3. 找到 `JAVA_HOME`
4. 点击"编辑"
5. 修改为新的 JDK 路径: `C:\Program Files\Java\jdk-17`
6. 保存

### 场景4: 清理无用变量

**问题:** 卸载软件后遗留的环境变量

**解决:**
1. 查看所有环境变量
2. 找到无用的变量
3. 点击"删除"
4. 确认删除

## 权限说明

### 用户变量 - 无需管理员权限

✅ 可以随时修改
✅ 只影响当前用户
✅ 推荐用于个人开发配置

### 系统变量 - 需要管理员权限

⚠️ 修改系统变量时:
1. **如果以普通用户运行:**
   - PowerShell 会提示权限不足
   - 操作失败,显示错误提示
   
2. **解决方案:**
   - 右键 SwitchEnv 图标
   - 选择"以管理员身份运行"
   - 然后就可以修改系统变量了

## 注意事项

### ⚠️ 重要警告

1. **系统变量很危险**
   - 不要随意删除 PATH, SYSTEM_ROOT 等关键变量
   - 可能导致系统无法正常运行

2. **PATH 变量特殊处理**
   - PATH 是分号分隔的路径列表
   - 修改时注意保留现有路径
   - 建议在末尾添加新路径

3. **生效时间**
   - 新打开的程序立即生效
   - 已运行的程序需要重启
   - 某些系统服务可能需要重启系统

4. **备份建议**
   - 修改前记录原值
   - 重要变量建议备份
   - SwitchEnv 可以帮你导出配置

### 💡 最佳实践

1. **优先使用用户变量**
   - 更安全
   - 无需管理员权限
   - 方便管理

2. **使用 SwitchEnv 配置**
   - 不修改系统变量
   - 在 SwitchEnv 中快速切换
   - 不影响系统环境

3. **命名规范**
   - 使用大写字母
   - 用下划线分隔: `MY_API_KEY`
   - 避免与系统变量冲突

4. **值的格式**
   - 路径使用反斜杠: `C:\Path\To\Dir`
   - 或使用正斜杠: `C:/Path/To/Dir`
   - 多个路径用分号分隔(PATH)

## 故障排除

### 问题1: 修改后不生效

**原因:** 已运行的程序不会自动刷新环境变量

**解决:**
- 重启应用程序
- 或重启命令行工具
- 极端情况重启系统

### 问题2: 提示权限不足

**原因:** 尝试修改系统变量但没有管理员权限

**解决:**
1. 关闭 SwitchEnv
2. 右键图标 → "以管理员身份运行"
3. 重新尝试修改

### 问题3: 修改被还原

**原因:** 可能是其他程序也在修改环境变量

**解决:**
- 检查是否有其他程序在运行
- 使用 SwitchEnv 的导出功能备份配置
- 必要时使用 Windows 系统设置界面

### 问题4: PATH 变量损坏

**症状:** 命令行找不到系统命令

**解决:**
1. 不要惊慌!
2. 打开 Windows 系统设置
3. 进入"系统" → "高级系统设置"
4. "环境变量"按钮
5. 手动修复 PATH 变量
6. 至少包含:
   ```
   C:\Windows\system32
   C:\Windows
   C:\Windows\System32\Wbem
   ```

## API 参考

### 前端 API

```typescript
// 获取所有环境变量
const env = await window.api.getWindowsEnv()
// 返回: { system: EnvVariable[], user: EnvVariable[], process: EnvVariable[] }

// 设置环境变量
const success = await window.api.setWindowsEnv('KEY', 'VALUE', 'user')
// 参数: key, value, scope ('system' | 'user')
// 返回: boolean

// 删除环境变量
const success = await window.api.deleteWindowsEnv('KEY', 'user')
// 参数: key, scope
// 返回: boolean

// 批量设置
const result = await window.api.setWindowsEnvBatch(variables, 'user')
// 返回: { success: number, failed: number }
```

### 后端方法

```typescript
// 在 EnvManager 中
setWindowsEnvVariable(key: string, value: string, scope: 'system' | 'user'): boolean
deleteWindowsEnvVariable(key: string, scope: 'system' | 'user'): boolean
setWindowsEnvVariables(variables: EnvVariable[], scope: 'system' | 'user'): { success: number, failed: number }
```

## 相关文档

- [WINDOWS_ENV_VARIABLES.md](./WINDOWS_ENV_VARIABLES.md) - Windows 环境变量功能说明
- [HOW_TO_USE_SYSTEM_ENV.md](./HOW_TO_USE_SYSTEM_ENV.md) - 系统环境变量使用指南
- [README.md](./README.md) - 项目总览

---

现在你可以像专业的系统管理员一样管理 Windows 环境变量了! 🎉
