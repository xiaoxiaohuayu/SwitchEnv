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
  background: var(--el-bg-color);
}

.editor-header {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color);
}

.editor-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.description {
  margin: 0 0 12px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.profile-status {
  margin-top: 8px;
}

.no-selection {
  padding: 40px;
  text-align: center;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  padding: 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--el-border-color);
}

.variables-list {
  flex: 1;
  padding: 16px;
}

.empty-variables {
  padding: 40px;
  text-align: center;
}

:deep(.el-table) {
  background: transparent;
}
</style>
