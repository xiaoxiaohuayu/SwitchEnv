<template>
  <el-dialog
    v-model="dialogVisible"
    title="Windows 环境变量"
    width="85%"
    top="5vh"
    @close="handleClose"
  >
    <div class="system-env-container">
      <!-- 分类标签页 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 系统变量 -->
        <el-tab-pane label="系统变量" name="system">
          <template #label>
            <span>
              <el-icon><Setting /></el-icon>
              系统变量 ({{ systemVariables.length }})
            </span>
          </template>
          <EnvVariableTable
            :variables="systemVariables"
            :search-text="searchText"
            @import-all="handleImportSystem"
            @import-single="handleImportSingle"
            @edit="(v) => handleEdit(v, 'system')"
            @delete="(v) => handleDelete(v, 'system')"
            @add="() => handleAdd('system')"
          />
        </el-tab-pane>

        <!-- 用户变量 -->
        <el-tab-pane label="用户变量" name="user">
          <template #label>
            <span>
              <el-icon><User /></el-icon>
              用户变量 ({{ userVariables.length }})
            </span>
          </template>
          <EnvVariableTable
            :variables="userVariables"
            :search-text="searchText"
            @import-all="handleImportUser"
            @import-single="handleImportSingle"
            @edit="(v) => handleEdit(v, 'user')"
            @delete="(v) => handleDelete(v, 'user')"
            @add="() => handleAdd('user')"
          />
        </el-tab-pane>

        <!-- 进程变量 -->
        <el-tab-pane label="进程变量" name="process">
          <template #label>
            <span>
              <el-icon><Monitor /></el-icon>
              进程变量 ({{ processVariables.length }})
            </span>
          </template>
          <EnvVariableTable
            :variables="processVariables"
            :search-text="searchText"
            @import-all="handleImportProcess"
            @import-single="handleImportSingle"
          />
        </el-tab-pane>

        <!-- 全部变量 -->
        <el-tab-pane label="全部" name="all">
          <template #label>
            <span>
              <el-icon><Folder /></el-icon>
              全部变量 ({{ allVariables.length }})
            </span>
          </template>
          <EnvVariableTable
            :variables="allVariables"
            :search-text="searchText"
            show-scope
            @import-all="handleImportAll"
            @import-single="handleImportSingle"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索环境变量名或值"
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Search, Download, Setting, User, Monitor, Folder, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { EnvVariable } from '../types'
import EnvVariableTable from './EnvVariableTable.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'import-all': [variables: EnvVariable[], scope: string]
  'import-single': [variable: EnvVariable]
}>()

const dialogVisible = ref(props.visible)
const searchText = ref('')
const activeTab = ref('system')
const systemVariables = ref<EnvVariable[]>([])
const userVariables = ref<EnvVariable[]>([])
const processVariables = ref<EnvVariable[]>([])

watch(() => props.visible, async (val) => {
  dialogVisible.value = val
  if (val) {
    searchText.value = ''
    activeTab.value = 'system'
    await loadWindowsEnvVariables()
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

const allVariables = computed(() => {
  return [
    ...systemVariables.value,
    ...userVariables.value,
    ...processVariables.value
  ]
})

const loadWindowsEnvVariables = async () => {
  try {
    const result = await window.api.getWindowsEnv()
    systemVariables.value = result.system
    userVariables.value = result.user
    processVariables.value = result.process
    console.log('加载 Windows 环境变量:', {
      system: result.system.length,
      user: result.user.length,
      process: result.process.length
    })
  } catch (error) {
    console.error('加载环境变量失败:', error)
    ElMessage.error('加载环境变量失败')
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleRefresh = async () => {
  await loadWindowsEnvVariables()
  ElMessage.success('刷新成功')
}

const handleImportSystem = () => {
  emit('import-all', systemVariables.value, '系统环境变量')
  handleClose()
}

const handleImportUser = () => {
  emit('import-all', userVariables.value, '用户环境变量')
  handleClose()
}

const handleImportProcess = () => {
  emit('import-all', processVariables.value, '进程环境变量')
  handleClose()
}

const handleImportAll = () => {
  emit('import-all', allVariables.value, '所有环境变量')
  handleClose()
}

const handleImportSingle = (variable: EnvVariable) => {
  emit('import-single', variable)
}

// 新增变量
const handleAdd = async (scope: 'system' | 'user') => {
  try {
    const result = await ElMessageBox.prompt(
      `请输入环境变量名和值（格式: KEY=VALUE）`,
      `新增${scope === 'system' ? '系统' : '用户'}环境变量`,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '例如: MY_VAR=my_value',
        inputValidator: (val: string) => {
          if (!val || !val.includes('=')) {
            return '请输入正确的格式: KEY=VALUE'
          }
          return true
        }
      }
    )
    
    const [key, ...valueParts] = result.value.split('=')
    const value = valueParts.join('=')
    
    if (!key || !value) {
      ElMessage.error('无效的格式')
      return
    }
    
    const success = await window.api.setWindowsEnv(key.trim(), value.trim(), scope)
    if (success) {
      ElMessage.success(`${scope === 'system' ? '系统' : '用户'}环境变量 ${key} 已添加`)
      await loadWindowsEnvVariables()
    } else {
      ElMessage.error('添加失败，请检查权限')
    }
  } catch {
    // 用户取消
  }
}

// 编辑变量
const handleEdit = async (variable: EnvVariable, scope: 'system' | 'user') => {
  try {
    const result = await ElMessageBox.prompt(
      `编辑 ${variable.key}`,
      `编辑${scope === 'system' ? '系统' : '用户'}环境变量`,
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        inputValue: variable.value,
        inputPlaceholder: '请输入新的值'
      }
    )
    
    if (result.value === variable.value) {
      ElMessage.info('值未变化')
      return
    }
    
    const success = await window.api.setWindowsEnv(variable.key, result.value, scope)
    if (success) {
      ElMessage.success(`${scope === 'system' ? '系统' : '用户'}环境变量 ${variable.key} 已更新`)
      await loadWindowsEnvVariables()
    } else {
      ElMessage.error('更新失败，请检查权限')
    }
  } catch {
    // 用户取消
  }
}

// 删除变量
const handleDelete = async (variable: EnvVariable, scope: 'system' | 'user') => {
  try {
    await ElMessageBox.confirm(
      `确认要删除${scope === 'system' ? '系统' : '用户'}环境变量 "${variable.key}" 吗？`,
      '删除环境变量',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const success = await window.api.deleteWindowsEnv(variable.key, scope)
    if (success) {
      ElMessage.success(`${scope === 'system' ? '系统' : '用户'}环境变量 ${variable.key} 已删除`)
      await loadWindowsEnvVariables()
    } else {
      ElMessage.error('删除失败，请检查权限')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  if (props.visible) {
    loadWindowsEnvVariables()
  }
})
</script>

<style scoped>
.system-env-container {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.var-key {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.var-value {
  background: var(--el-fill-color-lighter);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--el-text-color-regular);
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table__header) {
  font-weight: 600;
}
</style>
