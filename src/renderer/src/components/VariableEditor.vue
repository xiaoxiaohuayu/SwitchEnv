<template>
  <div class="variable-editor">
    <div class="editor-header">
      <div v-if="profile">
        <h2>{{ profile.name }}</h2>
        <p v-if="profile.description" class="description">{{ profile.description }}</p>
        <div class="profile-status">
          <el-tag v-if="profile.isActive" type="success">当前激活</el-tag>
          <el-tag v-else type="info">未激活</el-tag>
        </div>
      </div>
      <div v-else class="no-selection">
        <el-empty description="请从左侧选择一个配置" />
      </div>
    </div>

    <div v-if="profile" class="editor-content">
      <div class="toolbar">
        <el-button type="primary" @click="addVariable">
          <el-icon><Plus /></el-icon>
          添加变量
        </el-button>
        <el-button @click="$emit('show-templates')">
          <el-icon><DocumentAdd /></el-icon>
          使用模板
        </el-button>
        <el-button @click="$emit('import')">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button @click="$emit('export')">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="$emit('validate')">
          <el-icon><CircleCheck /></el-icon>
          验证配置
        </el-button>
      </div>

      <el-scrollbar class="variables-list">
        <div v-if="profile.variables.length === 0" class="empty-variables">
          <el-empty description="暂无环境变量，点击添加变量开始配置" />
        </div>
        
        <el-table v-else :data="profile.variables" stripe>
          <el-table-column label="必填" width="60" align="center">
            <template #default="{ row, $index }">
              <el-checkbox
                v-model="row.required"
                @change="handleVariableChange($index, row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column prop="key" label="变量名" min-width="200">
            <template #default="{ row, $index }">
              <el-input 
                v-model="row.key" 
                placeholder="变量名"
                @change="handleVariableChange($index, row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column prop="value" label="变量值" min-width="300">
            <template #default="{ row, $index }">
              <el-input 
                v-model="row.value" 
                placeholder="变量值"
                @change="handleVariableChange($index, row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ $index }">
              <el-button 
                type="danger" 
                size="small" 
                @click="removeVariable($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, DocumentAdd, Upload, Download, CircleCheck } from '@element-plus/icons-vue'
import type { EnvProfile, EnvVariable } from '../types'

defineProps<{
  profile: EnvProfile | null
}>()

const emit = defineEmits<{
  'update-variable': [index: number, variable: EnvVariable]
  'add-variable': []
  'remove-variable': [index: number]
  'show-templates': []
  'import': []
  'export': []
  'validate': []
}>()

const addVariable = () => {
  emit('add-variable')
}

const removeVariable = (index: number) => {
  emit('remove-variable', index)
}

const handleVariableChange = (index: number, variable: EnvVariable) => {
  emit('update-variable', index, variable)
}
</script>

<style scoped>
.variable-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--app-card-bg);
}

.editor-header {
  padding: 24px;
  border-bottom: 1px solid var(--app-border-color);
  background: var(--color-background-soft);
}

.editor-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
}

.description {
  margin: 0 0 16px 0;
  color: var(--color-text-soft);
  font-size: 14px;
  line-height: 1.5;
}

.profile-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-selection {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-mute);
}

.toolbar {
  padding: 12px 24px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-card-bg);
  align-items: center;
}

.variables-list {
  flex: 1;
  padding: 24px;
}

.empty-variables {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-soft);
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--color-background-mute);
  --el-table-border-color: var(--app-border-color);
  background: transparent;
  color: var(--color-text);
}

:deep(.el-table th.el-table__cell) {
  background: transparent;
  font-weight: 600;
  color: var(--color-text-soft);
}

:deep(.el-input__wrapper) {
  background-color: var(--color-background-soft);
  box-shadow: 0 0 0 1px var(--app-border-color) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
</style>
