<template>
  <el-dialog
    v-model="dialogVisible"
    title="环境配置文件编辑器"
    width="85%"
    top="5vh"
    @close="handleClose"
  >
    <div class="env-file-editor">
      <!-- 文件选择区域 -->
      <div class="file-selector">
        <el-select
          v-model="selectedFile"
          placeholder="选择要编辑的配置文件"
          style="width: 400px"
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
      <div v-if="selectedFile" class="editor-container">
        <div class="editor-header">
          <div class="file-info">
            <el-icon><Document /></el-icon>
            <span class="file-path">{{ selectedFile }}</span>
            <el-tag v-if="hasChanges" type="warning" size="small">未保存</el-tag>
            <el-tag v-else type="success" size="small">已保存</el-tag>
          </div>
          <div class="editor-tools">
            <el-text size="small">行数: {{ lineCount }}</el-text>
            <el-text size="small">字符数: {{ charCount }}</el-text>
          </div>
        </div>

        <el-input
          v-model="currentContent"
          type="textarea"
          :rows="20"
          placeholder="文件内容将显示在这里..."
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

      <el-empty v-else description="请选择一个配置文件开始编辑" />
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
  Upload
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
const availableFiles = ref<{ name: string; path: string; description: string }[]>([])
const selectedFile = ref<string>('')
const currentContent = ref<string>('')
const originalContent = ref<string>('')
const parsedVariables = ref<EnvVariable[]>([])
const showParsedVars = ref(true)

watch(() => props.visible, async (val) => {
  dialogVisible.value = val
  if (val) {
    await loadAvailableFiles()
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
      ElMessage.warning('文件不存在或无法读取')
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
  if (!selectedFile.value || !hasChanges.value) return

  try {
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
</script>

<style scoped>
.env-file-editor {
  min-height: 400px;
}

.file-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color);
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
  background: #1e1e1e;
  color: #d4d4d4;
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
