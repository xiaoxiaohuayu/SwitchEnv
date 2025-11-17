<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Edit } from '@element-plus/icons-vue'
import { useEnvStore } from './stores/env'
import ProfileList from './components/ProfileList.vue'
import VariableEditor from './components/VariableEditor.vue'
import ProfileDialog from './components/ProfileDialog.vue'
import TemplateDialog from './components/TemplateDialog.vue'
import SystemEnvDialog from './components/SystemEnvDialog.vue'
import TagManager from './components/TagManager.vue'
import ValidationPanel from './components/ValidationPanel.vue'
import EnvFileEditor from './components/EnvFileEditor.vue'
import type { EnvVariable, Template, Tag } from './types'

const envStore = useEnvStore()

const showProfileDialog = ref(false)
const showTemplateDialog = ref(false)
const showSystemEnvDialog = ref(false)
const showTagManager = ref(false)
const showValidationPanel = ref(false)
const showEnvFileEditor = ref(false)
const editingProfile = ref<any>(null)
const systemEnvVariables = ref<EnvVariable[]>([])
const validationPanelRef = ref<InstanceType<typeof ValidationPanel> | null>(null)

const currentProfile = computed(() => envStore.currentProfile)

onMounted(async () => {
  await envStore.loadProfiles()
  envStore.loadTags()  // 加载标签
  
  // 启动时扫描系统环境变量
  await loadSystemEnvVariables()
  
  // 如果没有任何配置，提示用户导入系统环境变量
  if (envStore.profiles.length === 0) {
    setTimeout(() => {
      ElMessageBox.confirm(
        `检测到本机有 ${systemEnvVariables.value.length} 个系统环境变量，是否查看？`,
        '系统环境变量',
        {
          confirmButtonText: '查看',
          cancelButtonText: '稍后',
          type: 'info'
        }
      ).then(() => {
        showSystemEnvDialog.value = true
      }).catch(() => {
        // 用户选择稍后
      })
    }, 1000)
  }
})

// 加载系统环境变量
const loadSystemEnvVariables = async () => {
  try {
    console.log('[App] 开始加载系统环境变量...')
    systemEnvVariables.value = await window.api.getSystemEnv()
    console.log('[App] 加载完成，共', systemEnvVariables.value.length, '个环境变量')
    console.log('[App] 前 5 个变量:', systemEnvVariables.value.slice(0, 5))
  } catch (error) {
    console.error('[App] 加载系统环境变量失败:', error)
  }
}

// 显示系统环境变量
const handleShowSystemEnv = () => {
  showSystemEnvDialog.value = true
}

// 显示环境配置文件编辑器
const handleShowEnvFileEditor = () => {
  showEnvFileEditor.value = true
}

// 从配置文件导入环境变量
const handleImportFromConfigFile = async (variables: EnvVariable[]) => {
  if (!envStore.currentProfileId) {
    ElMessage.warning('请先选择一个配置')
    return
  }
  
  for (const variable of variables) {
    await envStore.addVariable(envStore.currentProfileId, { ...variable })
  }
  ElMessage.success(`已导入 ${variables.length} 个环境变量`)
}

// 配置管理
const handleCreateProfile = () => {
  editingProfile.value = null
  showProfileDialog.value = true
}

const handleEditProfile = (id: string) => {
  editingProfile.value = envStore.profiles.find(p => p.id === id)
  showProfileDialog.value = true
}

const handleProfileSubmit = async (data: { name: string; description?: string }) => {
  try {
    if (editingProfile.value) {
      await envStore.updateProfile(editingProfile.value.id, data)
      ElMessage.success('配置已更新')
    } else {
      await envStore.createProfile(data.name, data.description)
      ElMessage.success('配置已创建')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleSelectProfile = (id: string) => {
  envStore.currentProfileId = id
}

const handleActivateProfile = async (id: string) => {
  try {
    await envStore.activateProfile(id)
    ElMessage.success('环境已切换')
  } catch (error) {
    ElMessage.error('切换失败')
  }
}

const handleDeleteProfile = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个配置吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await envStore.deleteProfile(id)
    ElMessage.success('配置已删除')
  } catch (error) {
    // 用户取消
  }
}

// 环境变量管理
const handleAddVariable = async () => {
  if (!envStore.currentProfileId) return
  
  const newVariable: EnvVariable = {
    key: '',
    value: ''
  }
  await envStore.addVariable(envStore.currentProfileId, newVariable)
}

const handleUpdateVariable = async (index: number, variable: EnvVariable) => {
  if (!envStore.currentProfileId) return
  await envStore.updateVariable(envStore.currentProfileId, index, variable)
}

const handleRemoveVariable = async (index: number) => {
  if (!envStore.currentProfileId) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个环境变量吗？',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await envStore.deleteVariable(envStore.currentProfileId, index)
    ElMessage.success('变量已删除')
  } catch (error) {
    // 用户取消
  }
}

// 模板功能
const handleShowTemplates = () => {
  showTemplateDialog.value = true
}

const handleSelectTemplate = async (template: Template) => {
  if (!envStore.currentProfileId) return
  
  for (const variable of template.variables) {
    await envStore.addVariable(envStore.currentProfileId, { ...variable })
  }
  ElMessage.success(`已添加 ${template.variables.length} 个环境变量`)
}

// 系统环境变量导入
const handleImportAllSystemEnv = async () => {
  try {
    const profile = await window.api.importSystemEnv()
    envStore.profiles.push(profile)
    await envStore.saveProfiles()
    ElMessage.success('系统环境变量已导入为新配置')
  } catch (error) {
    ElMessage.error('导入失败')
  }
}

const handleImportSingleSystemEnv = async (variable: EnvVariable) => {
  if (!envStore.currentProfileId) {
    ElMessage.warning('请先选择一个配置')
    return
  }
  
  await envStore.addVariable(envStore.currentProfileId, { ...variable })
  ElMessage.success(`已导入变量: ${variable.key}`)
}

// 标签管理
const handleManageTags = () => {
  showTagManager.value = true
}

const handleAddTag = (tag: Tag) => {
  envStore.addTag(tag)
  ElMessage.success('标签已添加')
}

const handleUpdateTag = (tag: Tag) => {
  envStore.updateTag(tag)
  ElMessage.success('标签已更新')
}

const handleDeleteTag = (id: string) => {
  envStore.deleteTag(id)
  ElMessage.success('标签已删除')
}

// 配置标签操作
const handleAddTagToProfile = (profileId: string, tagId: string) => {
  envStore.addTagToProfile(profileId, tagId)
}

const handleRemoveTagFromProfile = (profileId: string, tagId: string) => {
  envStore.removeTagFromProfile(profileId, tagId)
}

// 分组筛选
const handleFilterGroup = (group: string | null) => {
  envStore.selectedGroup = group
}

const handleFilterTags = (tags: string[]) => {
  envStore.selectedTags = tags
}

// 设置分组
const handleSetGroup = (profileId: string, group: string | null) => {
  envStore.setProfileGroup(profileId, group)
}

// 配置验证
const handleValidate = () => {
  showValidationPanel.value = !showValidationPanel.value
  if (showValidationPanel.value && validationPanelRef.value) {
    validationPanelRef.value.validate()
  }
}

// 导入导出功能
const handleImport = async () => {
  try {
    const { value: format } = await ElMessageBox.confirm(
      '请选择导入格式',
      '导入配置',
      {
        confirmButtonText: 'JSON',
        cancelButtonText: '.env',
        distinguishCancelAndClose: true
      }
    ) as any
    
    const importFormat = format ? 'json' : 'env'
    const success = await envStore.importProfile(importFormat)
    
    if (success) {
      ElMessage.success('导入成功')
    } else {
      ElMessage.warning('导入已取消')
    }
  } catch (error) {
    // 用户取消
  }
}

const handleExport = async () => {
  if (!envStore.currentProfileId) return
  
  try {
    const { value: format } = await ElMessageBox.confirm(
      '请选择导出格式',
      '导出配置',
      {
        confirmButtonText: 'JSON',
        cancelButtonText: '.env',
        distinguishCancelAndClose: true
      }
    ) as any
    
    const exportFormat = format ? 'json' : 'env'
    const success = await envStore.exportProfile(envStore.currentProfileId, exportFormat)
    
    if (success) {
      ElMessage.success('导出成功')
    } else {
      ElMessage.warning('导出已取消')
    }
  } catch (error) {
    // 用户取消
  }
}
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="header-content">
        <div>
          <h1>SwitchEnv</h1>
          <p>环境变量管理工具</p>
        </div>
        <el-button type="info" @click="handleShowSystemEnv">
          <el-icon><Monitor /></el-icon>
          系统环境变量 ({{ systemEnvVariables.length }})
        </el-button>
        <el-button type="warning" @click="handleShowEnvFileEditor">
          <el-icon><Edit /></el-icon>
          配置文件编辑器
        </el-button>
      </div>
    </div>
    
    <div class="app-content">
      <div class="sidebar">
        <ProfileList
          :profiles="envStore.filteredProfiles"
          :selected-id="envStore.currentProfileId"
          :tags="envStore.tags"
          :groups="envStore.allGroups"
          @create="handleCreateProfile"
          @select="handleSelectProfile"
          @activate="handleActivateProfile"
          @edit="handleEditProfile"
          @delete="handleDeleteProfile"
          @manage-tags="handleManageTags"
          @filter-group="handleFilterGroup"
          @filter-tags="handleFilterTags"
          @add-tag-to-profile="handleAddTagToProfile"
          @remove-tag-from-profile="handleRemoveTagFromProfile"
          @set-group="handleSetGroup"
        />
      </div>
      
      <div class="main-content">
        <VariableEditor
          :profile="currentProfile"
          @add-variable="handleAddVariable"
          @update-variable="handleUpdateVariable"
          @remove-variable="handleRemoveVariable"
          @show-templates="handleShowTemplates"
          @import="handleImport"
          @export="handleExport"
          @validate="handleValidate"
        />
      </div>
    </div>
    
    <!-- 对话框 -->
    <ProfileDialog
      v-model:visible="showProfileDialog"
      :profile="editingProfile"
      @submit="handleProfileSubmit"
    />
    
    <TemplateDialog
      v-model:visible="showTemplateDialog"
      @select="handleSelectTemplate"
    />
    
    <SystemEnvDialog
      v-model:visible="showSystemEnvDialog"
      :variables="systemEnvVariables"
      @import-all="handleImportAllSystemEnv"
      @import-single="handleImportSingleSystemEnv"
    />
    
    <!-- 环境配置文件编辑器 -->
    <EnvFileEditor
      v-model:visible="showEnvFileEditor"
      @import-variables="handleImportFromConfigFile"
    />
    
    <!-- 标签管理器 -->
    <TagManager
      v-model:visible="showTagManager"
      :tags="envStore.tags"
      @add-tag="handleAddTag"
      @update-tag="handleUpdateTag"
      @delete-tag="handleDeleteTag"
    />
    
    <!-- 验证面板 -->
    <el-drawer
      v-model="showValidationPanel"
      title="配置验证"
      direction="rtl"
      size="400px"
    >
      <ValidationPanel
        ref="validationPanelRef"
        :variables="currentProfile?.variables || []"
      />
    </el-drawer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page);
}

.app-header {
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.app-header p {
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 350px;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
