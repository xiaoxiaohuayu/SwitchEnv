<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择快捷模板"
    width="820px"
    top="5vh"
    @close="handleClose"
  >
    <div class="dialog-body">
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索模板名称或描述"
          clearable
          style="width: 260px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="toolbar-actions">
          <el-button
            type="success"
            plain
            :disabled="!currentProfile || currentProfile.variables.length === 0"
            @click="handleSaveCurrentAsTemplate"
          >
            <el-icon><Collection /></el-icon>
            从当前配置保存模板
          </el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="最近使用" name="recent" />
        <el-tab-pane
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.label"
          :name="cat.id"
        />
        <el-tab-pane label="我的模板" name="custom" />
      </el-tabs>

      <el-empty
        v-if="filteredTemplates.length === 0"
        description="暂无符合条件的模板"
        style="margin-top: 24px"
      />
      <el-row v-else :gutter="16">
        <el-col
          v-for="template in filteredTemplates"
          :key="template.id"
          :span="12"
        >
          <el-card
            class="template-card"
            shadow="hover"
            @click="handleSelectTemplate(template)"
          >
            <div class="template-header">
              <div>
                <h4>{{ template.name }}</h4>
                <p class="template-category">
                  <el-tag size="small" type="info">{{ getCategoryLabel(template.category) }}</el-tag>
                  <el-tag v-if="template.source === 'custom'" size="small" type="warning">自定义</el-tag>
                  <el-tag v-if="template.placeholders?.length" size="small">可参数化</el-tag>
                </p>
              </div>
              <el-tag size="small">{{ template.variables.length }} 个变量</el-tag>
            </div>
            <p class="template-description">{{ template.description }}</p>
            <div class="template-preview">
              <div
                v-for="(variable, index) in template.variables.slice(0, 3)"
                :key="index"
                class="preview-item"
              >
                <code>{{ variable.key }}</code>
              </div>
              <div v-if="template.variables.length > 3" class="more-indicator">
                ...还有 {{ template.variables.length - 3 }} 个变量
              </div>
            </div>
            <div class="template-footer">
              <el-text size="small">{{ template.source === 'custom' ? '来源：我的模板' : '来源：内置模板' }}</el-text>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <template #footer>
      <el-space wrap>
        <el-button @click="handleClose">取消</el-button>
      </el-space>
    </template>
  </el-dialog>

  <!-- 参数填写弹窗 -->
  <el-dialog
    v-model="paramDialogVisible"
    width="520px"
    :title="`填写模板参数 - ${selectedTemplate?.name || ''}`"
  >
    <el-form label-width="100px">
      <el-form-item
        v-for="ph in selectedTemplate?.placeholders || []"
        :key="ph.name"
        :label="ph.label"
      >
        <el-input
          v-model="placeholderValues[ph.name]"
          :placeholder="ph.description || '请输入参数值'"
        />
        <p v-if="ph.description" class="placeholder-desc">{{ ph.description }}</p>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="paramDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmParamTemplate">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Collection, Search } from '@element-plus/icons-vue'
import { templates, templateCategoryMeta } from '../data/templates'
import type { EnvProfile, EnvVariable, Template } from '../types'

const props = defineProps<{
  visible: boolean
  customTemplates: Template[]
  recentTemplateIds: string[]
  currentProfile: EnvProfile | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [payload: { template: Template; variables: EnvVariable[] }]
  'save-custom-template': []
}>()

const dialogVisible = ref(props.visible)
const searchText = ref('')
const activeTab = ref('all')
const categories = templateCategoryMeta
const paramDialogVisible = ref(false)
const selectedTemplate = ref<Template | null>(null)
const placeholderValues = reactive<Record<string, string>>({})

const mergedTemplates = computed(() => {
  return [...templates, ...(props.customTemplates || [])]
})

const recentTemplates = computed(() => {
  const map = new Map(mergedTemplates.value.map(t => [t.id, t]))
  return (props.recentTemplateIds || [])
    .map(id => map.get(id))
    .filter((t): t is Template => Boolean(t))
})

const filteredTemplates = computed(() => {
  let pool: Template[] = []
  if (activeTab.value === 'recent') {
    pool = recentTemplates.value
  } else if (activeTab.value === 'custom') {
    pool = mergedTemplates.value.filter(t => t.source === 'custom')
  } else if (activeTab.value === 'all') {
    pool = mergedTemplates.value
  } else {
    pool = mergedTemplates.value.filter(t => t.category === activeTab.value)
  }

  if (!searchText.value) return pool
  const search = searchText.value.toLowerCase()
  return pool.filter(
    t =>
      t.name.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
  )
})

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    searchText.value = ''
    activeTab.value = 'all'
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
  if (!val) {
    paramDialogVisible.value = false
  }
})

const handleClose = () => {
  dialogVisible.value = false
}

const getCategoryLabel = (category: Template['category']) => {
  const meta = categories.find(c => c.id === category)
  if (category === 'custom') return '自定义'
  return meta ? meta.label : '其他'
}

const resetPlaceholderValues = (template: Template) => {
  Object.keys(placeholderValues).forEach(k => delete placeholderValues[k])
  template.placeholders?.forEach(ph => {
    placeholderValues[ph.name] = ph.defaultValue || ''
  })
}

const cloneVariables = (vars: EnvVariable[]) => vars.map(v => ({ ...v }))

const resolveVariables = (template: Template): EnvVariable[] => {
  if (!template.placeholders || template.placeholders.length === 0) {
    return cloneVariables(template.variables)
  }

  return template.variables.map(v => {
    let val = v.value
    template.placeholders?.forEach(ph => {
      const placeholder = `{{${ph.name}}}`
      val = val.replaceAll(placeholder, placeholderValues[ph.name] ?? '')
    })
    return { ...v, value: val }
  })
}

const handleSelectTemplate = (template: Template) => {
  if (template.placeholders && template.placeholders.length > 0) {
    selectedTemplate.value = template
    resetPlaceholderValues(template)
    paramDialogVisible.value = true
    return
  }

  emit('select', { template, variables: resolveVariables(template) })
  handleClose()
}

const confirmParamTemplate = () => {
  if (!selectedTemplate.value) return
  emit('select', {
    template: selectedTemplate.value,
    variables: resolveVariables(selectedTemplate.value)
  })
  paramDialogVisible.value = false
  handleClose()
}

const handleSaveCurrentAsTemplate = () => {
  emit('save-custom-template')
}
</script>

<style scoped>
.template-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.template-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.template-description {
  margin: 0 0 12px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.template-preview {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}

.preview-item {
  margin-bottom: 4px;
}

.preview-item code {
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
}

.more-indicator {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  margin-top: 8px;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.template-category {
  margin: 4px 0 0 0;
}

.template-footer {
  margin-top: 8px;
  color: var(--el-text-color-placeholder);
}

.placeholder-desc {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
