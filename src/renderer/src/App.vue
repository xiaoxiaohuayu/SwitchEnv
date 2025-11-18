<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEnvStore } from './stores/env'
import ProfileList from './components/ProfileList.vue'
import VariableEditor from './components/VariableEditor.vue'
import ProfileDialog from './components/ProfileDialog.vue'
import TemplateDialog from './components/TemplateDialog.vue'
import SystemEnvDialog from './components/SystemEnvDialog.vue'
import TagManager from './components/TagManager.vue'
import ValidationPanel from './components/ValidationPanel.vue'
import EnvFileEditor from './components/EnvFileEditor.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppShell from './components/layout/AppShell.vue'
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
const envFilePath = ref('')
const lastDiff = ref<{ added: EnvVariable[]; removed: EnvVariable[]; changed: { key: string; oldValue: string; newValue: string }[] } | null>(null)

const currentProfile = computed(() => envStore.currentProfile)

const updateTrayState = async () => {
  if (!window.api?.updateTrayState) return
  const recentProfiles = envStore.profiles
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5)
    .map(profile => ({
      id: profile.id,
      name: profile.name
    }))
  const active = envStore.activeProfile
    ? { id: envStore.activeProfile.id, name: envStore.activeProfile.name }
    : null
  try {
    await window.api.updateTrayState({
      activeProfile: active,
      recentProfiles
    })
  } catch (error) {
    console.error('Failed to update tray state:', error)
  }
}

const handleExternalSwitch = (_event: any, profileId: string) => {
  if (profileId) {
    handleActivateProfile(profileId)
  }
}

onMounted(async () => {
  await envStore.loadProfiles()
  envStore.loadTags()  // 加载标签
  envStore.loadCustomTemplates()
  envStore.loadRecentTemplates()
  
  // 启动时扫描系统环境变量
  await loadSystemEnvVariables()

  // 获取写入目标位置
  try {
    envFilePath.value = await window.api.getEnvFilePath()
  } catch (error) {
    console.error('读取环境文件路径失败', error)
  }
  
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

  updateTrayState()
  window.electron?.ipcRenderer?.on('switch-profile', handleExternalSwitch)
})

onBeforeUnmount(() => {
  window.electron?.ipcRenderer?.removeListener('switch-profile', handleExternalSwitch)
  stopProfilesWatcher()
  stopActiveWatcher()
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
  
  const result = await mergeVariables(variables)
  if (!result) return
  ElMessage.success(`已导入 ${result.added + result.updated} 个环境变量（新增 ${result.added}，更新 ${result.updated}）`)
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

const diffVariables = (oldVars: EnvVariable[], newVars: EnvVariable[]) => {
  const oldMap = new Map(oldVars.map(v => [v.key, v]))
  const newMap = new Map(newVars.map(v => [v.key, v]))

  const added: EnvVariable[] = []
  const removed: EnvVariable[] = []
  const changed: { key: string; oldValue: string; newValue: string }[] = []

  newMap.forEach((val, key) => {
    if (!oldMap.has(key)) {
      added.push(val)
    } else if (oldMap.get(key)?.value !== val.value) {
      changed.push({ key, oldValue: oldMap.get(key)?.value || '', newValue: val.value })
    }
  })

  oldMap.forEach((val, key) => {
    if (!newMap.has(key)) {
      removed.push(val)
    }
  })

  return { added, removed, changed }
}

const summarizeDiffLines = (diff: {
  added: EnvVariable[]
  removed: EnvVariable[]
  changed: { key: string; oldValue: string; newValue: string }[]
}) => {
  const lines: string[] = []
  diff.added.slice(0, 5).forEach(v => lines.push(`+ ${v.key}`))
  diff.changed.slice(0, 5).forEach(v => lines.push(`~ ${v.key}`))
  diff.removed.slice(0, 5).forEach(v => lines.push(`- ${v.key}`))
  if (diff.added.length + diff.changed.length + diff.removed.length > lines.length) {
    lines.push('...还有更多变更')
  }
  if (lines.length === 0) {
    lines.push('没有变量变化')
  }
  return lines
}

const buildDiffPreview = (targetName: string, summaryText: string, lines: string[]) => {
  const content = [
    `即将切换到「${targetName}」`,
    summaryText,
    '',
    ...lines
  ].join('\n')
  return h('div', { style: 'white-space: pre-line' }, content)
}

const handleActivateProfile = async (id: string) => {
  const target = envStore.profiles.find(p => p.id === id)
  if (!target) return

  const previousActive = envStore.activeProfile
  const diff = diffVariables(previousActive?.variables || [], target.variables)
  const summaryText = `新增 ${diff.added.length} · 修改 ${diff.changed.length} · 删除 ${diff.removed.length}`

  const diffLines = summarizeDiffLines(diff)
  const confirmContent = buildDiffPreview(target.name, summaryText, diffLines)

  try {
    await ElMessageBox.confirm(
      confirmContent,
      '应用变更',
      {
        confirmButtonText: '确认切换',
        cancelButtonText: '取消',
        type: 'info',
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
        closeOnPressEscape: false
      }
    )
  } catch {
    return
  }

  try {
    await envStore.activateProfile(id)
    lastDiff.value = diff
    ElMessage.success(`环境已切换：${summaryText}`)
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

const mergeVariables = async (variables: EnvVariable[]) => {
  if (!envStore.currentProfileId) return null
  const profile = envStore.profiles.find(p => p.id === envStore.currentProfileId)
  if (!profile) return null

  const existing = new Map<string, EnvVariable>()
  profile.variables.forEach(v => existing.set(v.key, { ...v }))

  let added = 0
  let updated = 0

  variables.forEach(variable => {
    if (existing.has(variable.key)) {
      existing.set(variable.key, { ...existing.get(variable.key)!, ...variable })
      updated += 1
    } else {
      existing.set(variable.key, { ...variable })
      added += 1
    }
  })

  profile.variables = Array.from(existing.values())
  profile.updatedAt = Date.now()
  await envStore.saveProfiles()

  return { added, updated }
}

const handleSelectTemplate = async (payload: { template: Template; variables: EnvVariable[] }) => {
  if (!envStore.currentProfileId) {
    ElMessage.warning('请先选择一个配置')
    return
  }

  const result = await mergeVariables(payload.variables)
  if (!result) return
  envStore.recordTemplateUsage(payload.template.id)
  ElMessage.success(`已应用模板：新增 ${result.added}，更新 ${result.updated}`)
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

  const result = await mergeVariables([{ ...variable }])
  if (!result) return
  const message =
    result.updated > 0
      ? `已更新变量 ${variable.key}`
      : `已新增变量 ${variable.key}`
  ElMessage.success(message)
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

const handleSearchKeyword = (value: string) => {
  envStore.searchKeyword = value
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

const handleSaveCustomTemplate = async () => {
  if (!envStore.currentProfile) {
    ElMessage.warning('请先选择一个配置')
    return
  }

  try {
    const { value: name } = await ElMessageBox.prompt(
      '请输入模板名称',
      '保存当前配置为模板',
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        inputValue: `${envStore.currentProfile.name} 模板`,
        inputPlaceholder: '例如：测试环境模板',
        inputValidator: (val: string) => !!val && val.trim().length >= 2,
        inputErrorMessage: '模板名称至少 2 个字符'
      }
    )
    envStore.addCustomTemplate({
      name: name.trim(),
      description: envStore.currentProfile.description || '',
      variables: envStore.currentProfile.variables.map(v => ({ ...v }))
    })
    ElMessage.success('模板已保存')
  } catch {
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

const stopProfilesWatcher = watch(
  () => envStore.profiles.map(profile => ({
    id: profile.id,
    name: profile.name,
    updatedAt: profile.updatedAt,
    isActive: profile.isActive
  })),
  () => {
    updateTrayState()
  },
  { deep: true }
)

const stopActiveWatcher = watch(
  () => envStore.activeProfile ? envStore.activeProfile.id : null,
  () => {
    updateTrayState()
  }
)
</script>

<template>
  <div class="app-container">
    <AppHeader
      :active-profile-name="envStore.activeProfile?.name || null"
      :active-profile-updated-at="envStore.activeProfile?.updatedAt || null"
      :env-file-path="envFilePath"
      :last-diff="lastDiff"
      :system-env-count="systemEnvVariables.length"
      @show-system-env="handleShowSystemEnv"
      @show-env-file="handleShowEnvFileEditor"
    />

    <AppShell>
      <template #sidebar>
        <ProfileList
          :profiles="envStore.filteredProfiles"
          :selected-id="envStore.currentProfileId"
          :tags="envStore.tags"
          :groups="envStore.allGroups"
          :search-keyword="envStore.searchKeyword"
          @create="handleCreateProfile"
          @select="handleSelectProfile"
          @activate="handleActivateProfile"
          @edit="handleEditProfile"
          @delete="handleDeleteProfile"
          @manage-tags="handleManageTags"
          @filter-group="handleFilterGroup"
          @filter-tags="handleFilterTags"
          @update:search-keyword="handleSearchKeyword"
          @add-tag-to-profile="handleAddTagToProfile"
          @remove-tag-from-profile="handleRemoveTagFromProfile"
          @set-group="handleSetGroup"
        />
      </template>
      <template #main>
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
      </template>
    </AppShell>
    
    <!-- 对话框 -->
    <ProfileDialog
      v-model:visible="showProfileDialog"
      :profile="editingProfile"
      @submit="handleProfileSubmit"
    />
    
    <TemplateDialog
      v-model:visible="showTemplateDialog"
      :custom-templates="envStore.customTemplates"
      :recent-template-ids="envStore.recentTemplateIds"
      :current-profile="currentProfile"
      @select="handleSelectTemplate"
      @save-custom-template="handleSaveCustomTemplate"
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
      :profile="currentProfile"
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
  min-height: 100vh;
  background: var(--color-background);
}
</style>
