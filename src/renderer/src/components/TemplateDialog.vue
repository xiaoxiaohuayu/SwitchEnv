<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择快捷模板"
    width="700px"
    @close="handleClose"
  >
    <el-row :gutter="16">
      <el-col 
        v-for="template in templates" 
        :key="template.name"
        :span="12"
      >
        <el-card 
          class="template-card" 
          shadow="hover"
          @click="handleSelectTemplate(template)"
        >
          <div class="template-header">
            <h4>{{ template.name }}</h4>
            <el-tag size="small">{{ template.variables.length }} 个变量</el-tag>
          </div>
          <p class="template-description">{{ template.description }}</p>
          <div class="template-preview">
            <div v-for="(variable, index) in template.variables.slice(0, 3)" :key="index" class="preview-item">
              <code>{{ variable.key }}</code>
            </div>
            <div v-if="template.variables.length > 3" class="more-indicator">
              ...还有 {{ template.variables.length - 3 }} 个变量
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { templates } from '../data/templates'
import type { Template } from '../types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [template: Template]
}>()

const dialogVisible = ref(props.visible)

watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

const handleClose = () => {
  dialogVisible.value = false
}

const handleSelectTemplate = (template: Template) => {
  emit('select', template)
  handleClose()
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
</style>
