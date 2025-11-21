<template>
  <el-dialog
    v-model="dialogVisible"
    :title="getDialogTitle()"
    width="85%"
    top="5vh"
    @close="handleClose"
  >
    <div class="env-file-editor">
      <!-- 文件选择区域 -->
      <div class="file-selector">
        <div style="display: flex; gap: 12px; align-items: center; flex: 1">
          <el-radio-group v-model="editMode" @change="handleModeChange">
            <el-radio-button value="file">配置文件</el-radio-button>
            <el-radio-button value="system-env">系统环境变量</el-radio-button>
            <el-radio-button value="user-env">用户环境变量</el-radio-button>
          </el-radio-group>
          
          <el-select
            v-if="editMode === 'file'"
            v-model="selectedFile"
            placeholder="选择要编辑的配置文件"
            style="width: 400px"
            filterable
            allow-create
            @change="handleFileChange"
          >
            <el-option
              v-for="file in availableFiles"
              :key="file.path"
              :label="`${file.name} - ${file.description}`"
              :value="file.path"
            >
              <div class="file-option">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-desc">{{ file.description }}</span>
              </div>
            </el-option>
          </el-select>
          
          <template v-if="editMode === 'file'">
            <el-tooltip content="创建新的 PowerShell Profile 文件" placement="top">
              <el-button type="success" plain @click="handleCreatePSProfile">
                <el-icon><DocumentAdd /></el-icon>
                创建 PS Profile
              </el-button>
            </el-tooltip>
            
            <el-tooltip content="手动输入文件路径" placement="top">
              <el-button plain @click="handleManualInput">
                <el-icon><Edit /></el-icon>
                手动输入
              </el-button>
            </el-tooltip>
          </template>
        </div>
        
        <div class="file-actions">
          <el-button type="primary" :disabled="!selectedFile" @click="handleLoad">
            <el-icon><Refresh /></el-icon>
            重新加载
          </el-button>
          <el-button type="success" :disabled="!hasChanges" @click="handleSave">
            <el-icon><DocumentChecked /></el-icon>
            保存更改
          </el-button>
          <el-button type="warning" :disabled="!currentContent" @click="handleImportVariables">
            <el-icon><Download /></el-icon>
            导入环境变量到配置
          </el-button>
          <el-button
            type="danger"
            plain
            :disabled="!props.profile || !selectedFile"
            @click="handleApplyProfileToFile"
          >
            <el-icon><Upload /></el-icon>
            将当前配置写入文件
          </el-button>
        </div>
      </div>

      <!-- 编辑器区域 -->
      <div v-if="editMode !== 'file' || selectedFile" class="editor-container">
        <div class="editor-header">
          <div class="file-info">
            <el-icon><Document /></el-icon>
            <span v-if="editMode === 'file'" class="file-path">{{ selectedFile }}</span>
            <span v-else-if="editMode === 'system-env'" class="file-path">
              Windows 系统环境变量 (需要管理员权限)
            </span>
            <span v-else class="file-path">
              Windows 用户环境变量 (当前用户)
            </span>
            <el-tag v-if="hasChanges" type="warning" size="small">未保存</el-tag>
            <el-tag v-else type="success" size="small">已保存</el-tag>
          </div>
          <div class="editor-tools">
            <el-text size="small">行数: {{ lineCount }}</el-text>
            <el-text size="small">字符数: {{ charCount }}</el-text>
            <el-text v-if="editMode !== 'file'" size="small" type="primary">
              检测到: {{ parsedVariables.length }} 个变量
            </el-text>
          </div>
        </div>

        <el-input
          v-model="currentContent"
          type="textarea"
          :rows="20"
          :readonly="false"
          :placeholder="getPlaceholder()"
          class="code-editor"
          @input="handleContentChange"
        />

        <!-- 提取的环境变量预览 -->
        <div v-if="parsedVariables.length > 0" class="parsed-variables">
          <div class="section-header">
            <h4>检测到的环境变量 ({{ parsedVariables.length }})</h4>
            <el-button size="small" @click="showParsedVars = !showParsedVars">
              {{ showParsedVars ? '隐藏' : '显示' }}
            </el-button>
          </div>
          <el-collapse-transition>
            <el-table
              v-show="showParsedVars"
              :data="parsedVariables"
              stripe
              size="small"
              max-height="200"
            >
              <el-table-column prop="key" label="变量名" width="200" />
              <el-table-column prop="value" label="变量值" show-overflow-tooltip />
            </el-table>
          </el-collapse-transition>
        </div>
      </div>

      <el-empty v-else description="请选择一个配置文件开始编辑">
        <template #description>
          <div style="line-height: 1.8">
            <p>请选择一个配置文件开始编辑</p>
            <p style="font-size: 12px; color: var(--el-text-color-secondary)">
              如果没有可用文件，请点击“创建 PS Profile”或“手动输入”按钮
            </p>
          </div>
        </template>
      </el-empty>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-alert
          v-if="hasChanges"
          title="您有未保存的更改"
          type="warning"
          :closable="false"
          style="margin-right: auto"
        />
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="selectedFile"
          type="primary"
          :disabled="!hasChanges"
          @click="handleSave"
        >
          保存更改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Refresh,
  DocumentChecked,
  Download,
  Upload,
  DocumentAdd,
  Edit
} from '@element-plus/icons-vue'
import type { EnvProfile, EnvVariable } from '../types'

const props = defineProps<{
  visible: boolean
  profile: EnvProfile | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'import-variables': [variables: EnvVariable[]]
}>()

const dialogVisible = ref(props.visible)
const editMode = ref<'file' | 'system-env' | 'user-env'>('file')
const availableFiles = ref<{ name: string; path: string; description: string }[]>([])
const selectedFile = ref<string>('')
const currentContent = ref<string>('')
const originalContent = ref<string>('')
const parsedVariables = ref<EnvVariable[]>([])
const showParsedVars = ref(true)

watch(() => props.visible, async (val) => {
  dialogVisible.value = val
  if (val) {
    // 默认加载用户环境变量模式
    if (!currentContent.value) {
      editMode.value = 'user-env'
      await loadUserEnv()
    } else {
      await loadAvailableFiles()
    }
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

// 计算属性
const hasChanges = computed(() => {
  return currentContent.value !== originalContent.value
})

const lineCount = computed(() => {
  return currentContent.value ? currentContent.value.split('\n').length : 0
})

const charCount = computed(() => {
  return currentContent.value ? currentContent.value.length : 0
})

const getPlaceholder = () => {
  if (editMode.value === 'system-env') {
    return '直接编辑 Windows 系统环境变量，格式: KEY=VALUE（每行一个）\n\n例如:\nJAVA_HOME=C:\\Program Files\\Java\\jdk-17\nNODE_ENV=production'
  } else if (editMode.value === 'user-env') {
    return '直接编辑 Windows 用户环境变量，格式: KEY=VALUE（每行一个）\n\n例如:\nMY_API_KEY=abc123\nAPI_URL=https://api.example.com'
  } else {
    return '文件内容将显示在这里...'
  }
}

const getDialogTitle = () => {
  if (editMode.value === 'system-env') {
    return 'Windows 系统环境变量编辑器'
  } else if (editMode.value === 'user-env') {
    return 'Windows 用户环境变量编辑器'
  } else {
    return '环境配置文件编辑器'
  }
}

// 加载可用的配置文件列表
const loadAvailableFiles = async (): Promise<void> => {
  try {
    const files = await window.api.getEnvConfigFiles()
    availableFiles.value = files
    console.log('[EnvFileEditor] 可用的配置文件:', files)
  } catch (error) {
    console.error('Failed to load env config files:', error)
    ElMessage.error('获取配置文件列表失败')
  }
}

// 处理模式切换
const handleModeChange = async (): Promise<void> => {
  // 如果有未保存的更改，提示用户
  if (hasChanges.value) {
    try {
      await ElMessageBox.confirm(
        '当前有未保存的更改，切换模式将丢失这些更改。是否继续？',
        '确认切换',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      // 用户取消，恢复之前的模式
      return
    }
  }

  // 清空当前内容
  currentContent.value = ''
  originalContent.value = ''
  selectedFile.value = ''
  parsedVariables.value = []

  // 根据模式加载内容
  if (editMode.value === 'system-env') {
    await loadSystemEnv()
  } else if (editMode.value === 'user-env') {
    await loadUserEnv()
  }
}

// 加载系统环境变量
const loadSystemEnv = async (): Promise<void> => {
  try {
    const result = await window.api.getWindowsEnv()
    const envLines = result.system.map(v => `${v.key}=${v.value}`)
    currentContent.value = envLines.join('\n')
    originalContent.value = currentContent.value
    await parseVariables()
    ElMessage.success(`加载了 ${result.system.length} 个系统环境变量`)
  } catch (error) {
    console.error('Failed to load system env:', error)
    ElMessage.error('加载系统环境变量失败')
  }
}

// 加载用户环境变量
const loadUserEnv = async (): Promise<void> => {
  try {
    const result = await window.api.getWindowsEnv()
    const envLines = result.user.map(v => `${v.key}=${v.value}`)
    currentContent.value = envLines.join('\n')
    originalContent.value = currentContent.value
    await parseVariables()
    ElMessage.success(`加载了 ${result.user.length} 个用户环境变量`)
  } catch (error) {
    console.error('Failed to load user env:', error)
    ElMessage.error('加载用户环境变量失败')
  }
}

// 处理文件选择
const handleFileChange = async (): Promise<void> => {
  if (!selectedFile.value) return

  // 如果有未保存的更改，提示用户
  if (hasChanges.value) {
    try {
      await ElMessageBox.confirm(
        '当前有未保存的更改，切换文件将丢失这些更改。是否继续？',
        '确认切换',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      // 用户取消，恢复之前的选择
      selectedFile.value = ''
      return
    }
  }

  await handleLoad()
}

// 加载文件内容
const handleLoad = async (): Promise<void> => {
  if (!selectedFile.value) return

  try {
    const content = await window.api.readEnvConfigFile(selectedFile.value)
    if (content !== null) {
      currentContent.value = content
      originalContent.value = content
      
      // 解析环境变量
      await parseVariables()
      
      ElMessage.success('文件加载成功')
    } else {
      // 文件不存在，提示用户是否创建
      try {
        await ElMessageBox.confirm(
          `文件不存在: ${selectedFile.value}\n\n是否创建一个新的空文件？`,
          '文件不存在',
          {
            confirmButtonText: '创建文件',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        // 用户确认创建
        currentContent.value = '# 环境配置文件\n# 由 SwitchEnv 创建\n\n'
        originalContent.value = ''
        ElMessage.info('请编辑并保存文件')
      } catch {
        // 用户取消创建
        selectedFile.value = ''
      }
    }
  } catch (error) {
    console.error('Failed to read file:', error)
    ElMessage.error('读取文件失败')
  }
}

// 处理内容变化
const handleContentChange = async (): Promise<void> => {
  await parseVariables()
}

const handleApplyProfileToFile = async (): Promise<void> => {
  if (!props.profile || !selectedFile.value) {
    ElMessage.warning('请选择配置和目标文件')
    return
  }

  try {
    await ElMessageBox.confirm(
      `将把「${props.profile.name}」中的变量写入 ${selectedFile.value}，原文件会自动备份。继续吗？`,
      '应用到系统配置文件',
      {
        confirmButtonText: '应用',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  try {
    const success = await window.api.applyProfileToFile(selectedFile.value, props.profile)
    if (success) {
      ElMessage.success('已写入配置文件（已备份原文件）')
    } else {
      ElMessage.error('写入失败')
    }
  } catch (error) {
    console.error('Failed to apply profile to file:', error)
    ElMessage.error('写入失败')
  }
}

// 解析环境变量
const parseVariables = async (): Promise<void> => {
  if (!currentContent.value) {
    parsedVariables.value = []
    return
  }

  try {
    const variables = await window.api.parseEnvFromConfig(currentContent.value)
    parsedVariables.value = variables
  } catch (error) {
    console.error('Failed to parse variables:', error)
  }
}

// 保存文件
const handleSave = async (): Promise<void> => {
  if (!hasChanges.value) return

  try {
    // 如果是系统或用户环境变量模式
    if (editMode.value === 'system-env' || editMode.value === 'user-env') {
      await saveToWindowsEnv()
      return
    }

    // 文件模式
    if (!selectedFile.value) return

    await ElMessageBox.confirm(
      '保存将修改系统配置文件，原文件会自动备份。是否继续？',
      '确认保存',
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const success = await window.api.writeEnvConfigFile(
      selectedFile.value,
      currentContent.value
    )

    if (success) {
      originalContent.value = currentContent.value
      ElMessage.success('保存成功！原文件已自动备份')
    } else {
      ElMessage.error('保存失败')
    }
  } catch {
    // 用户取消
  }
}

// 保存到 Windows 环境变量
const saveToWindowsEnv = async (): Promise<void> => {
  const scope = editMode.value === 'system-env' ? 'system' : 'user'
  const scopeName = scope === 'system' ? '系统' : '用户'

  try {
    await ElMessageBox.confirm(
      `确认要将更改保存到 Windows ${scopeName}环境变量吗？\n\n${scope === 'system' ? '⚠️ 需要管理员权限' : '✅ 无需管理员权限'}`,
      `保存到${scopeName}环境变量`,
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 解析当前内容
    const variables = currentContent.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [key, ...valueParts] = line.split('=')
        return {
          key: key.trim(),
          value: valueParts.join('=').trim()
        }
      })
      .filter(v => v.key && v.value)

    if (variables.length === 0) {
      ElMessage.warning('没有检测到有效的环境变量')
      return
    }

    // 批量设置环境变量
    const result = await window.api.setWindowsEnvBatch(variables, scope)

    if (result.success > 0) {
      originalContent.value = currentContent.value
      ElMessage.success(`成功保存 ${result.success} 个环境变量${result.failed > 0 ? `，${result.failed} 个失败` : ''}`)
      
      // 重新加载
      if (editMode.value === 'system-env') {
        await loadSystemEnv()
      } else {
        await loadUserEnv()
      }
    } else {
      ElMessage.error('保存失败，请检查权限')
    }
  } catch {
    // 用户取消
  }
}

// 导入环境变量到配置
const handleImportVariables = (): void => {
  if (parsedVariables.value.length === 0) {
    ElMessage.warning('未检测到环境变量')
    return
  }

  emit('import-variables', parsedVariables.value)
  ElMessage.success(`已导入 ${parsedVariables.value.length} 个环境变量`)
}

// 关闭对话框
const handleClose = async (): Promise<void> => {
  if (hasChanges.value) {
    try {
      await ElMessageBox.confirm(
        '有未保存的更改，确定要关闭吗？',
        '确认关闭',
        {
          confirmButtonText: '关闭',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  dialogVisible.value = false
  selectedFile.value = ''
  currentContent.value = ''
  originalContent.value = ''
  parsedVariables.value = []
}

// 创建 PowerShell Profile
const handleCreatePSProfile = async (): Promise<void> => {
  try {
    const userProfile = await ElMessageBox.prompt(
      'PowerShell Profile 路径（默认为当前用户）',
      '创建 PowerShell Profile',
      {
        confirmButtonText: '创建',
        cancelButtonText: '取消',
        inputValue: `${process.env.USERPROFILE || ''}\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1`,
        inputPlaceholder: '请输入文件路径'
      }
    )
    
    if (userProfile.value) {
      selectedFile.value = userProfile.value.trim()
      currentContent.value = '# PowerShell Profile\n# 由 SwitchEnv 创建\n\n'
      originalContent.value = ''
      
      // 自动保存创建文件
      const success = await window.api.writeEnvConfigFile(
        selectedFile.value,
        currentContent.value
      )
      
      if (success) {
        originalContent.value = currentContent.value
        ElMessage.success('文件创建成功！')
        // 重新加载文件列表
        await loadAvailableFiles()
      } else {
        ElMessage.error('文件创建失败')
      }
    }
  } catch {
    // 用户取消
  }
}

// 手动输入文件路径
const handleManualInput = async (): Promise<void> => {
  try {
    const result = await ElMessageBox.prompt(
      '请输入要编辑的文件路径',
      '手动输入文件路径',
      {
        confirmButtonText: '打开',
        cancelButtonText: '取消',
        inputPlaceholder: '例如: C:\\Users\\YourName\\.bashrc',
        inputValidator: (val: string) => !!val && val.trim().length > 0,
        inputErrorMessage: '请输入有效的文件路径'
      }
    )
    
    if (result.value) {
      selectedFile.value = result.value.trim()
      await handleLoad()
    }
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.env-file-editor {
  min-height: 400px;
}

.file-selector {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color);
  gap: 16px;
  flex-wrap: wrap;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.file-option {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', monospace;
}

.file-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-path {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.editor-tools {
  display: flex;
  gap: 16px;
}

.code-editor {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-editor :deep(textarea) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  background: #282c34;
  color: #abb2bf;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
}

.code-editor :deep(textarea:focus) {
  background: #1e2127;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.parsed-variables {
  margin-top: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

:deep(.el-table) {
  font-size: 12px;
}

:deep(.el-table td) {
  font-family: 'Consolas', 'Monaco', monospace;
}
</style>
