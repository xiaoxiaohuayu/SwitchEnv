<template>
  <div class="env-variable-table">
    <div class="toolbar">
      <el-input
        v-model="localSearchText"
        placeholder="搜索环境变量名或值"
        clearable
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="toolbar-actions">
        <el-tag>总计: {{ filteredVariables.length }} 个变量</el-tag>
        <el-button type="success" @click="handleAddVariable">
          <el-icon><Plus /></el-icon>
          新增变量
        </el-button>
        <el-button type="primary" @click="handleImportAll">
          <el-icon><Download /></el-icon>
          导入全部到新配置
        </el-button>
      </div>
    </div>

    <el-table
      :data="paginatedVariables"
      stripe
      border
      height="450"
      :default-sort="{ prop: 'key', order: 'ascending' }"
    >
      <el-table-column type="index" label="#" width="60" />
      
      <el-table-column
        prop="key"
        label="变量名"
        min-width="200"
        sortable
      >
        <template #default="{ row }">
          <code class="var-key">{{ row.key }}</code>
        </template>
      </el-table-column>
      
      <el-table-column
        v-if="showScope"
        prop="scope"
        label="作用域"
        width="100"
        sortable
      >
        <template #default="{ row }">
          <el-tag
            v-if="row.scope"
            :type="getScopeType(row.scope)"
            size="small"
          >
            {{ getScopeLabel(row.scope) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="value"
        label="变量值"
        min-width="400"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <code class="var-value">{{ row.value }}</code>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            link
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
          <el-button
            type="success"
            size="small"
            link
            @click="handleImportSingle(row)"
          >
            导入
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[20, 50, 100, 200]"
      :total="filteredVariables.length"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: center"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Download, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { EnvVariable } from '../types'

const props = withDefaults(defineProps<{
  variables: EnvVariable[]
  searchText?: string
  showScope?: boolean
  editable?: boolean
}>(), {
  searchText: '',
  showScope: false,
  editable: true
})

const emit = defineEmits<{
  'import-all': []
  'import-single': [variable: EnvVariable]
  'edit': [variable: EnvVariable]
  'delete': [variable: EnvVariable]
  'add': []
  'refresh': []
}>()

const localSearchText = ref(props.searchText)
const currentPage = ref(1)
const pageSize = ref(20)

watch(() => props.searchText, (val) => {
  localSearchText.value = val
})

// 过滤后的变量
const filteredVariables = computed(() => {
  if (!localSearchText.value) {
    return props.variables
  }
  
  const search = localSearchText.value.toLowerCase()
  return props.variables.filter(v => 
    v.key.toLowerCase().includes(search) || 
    v.value.toLowerCase().includes(search)
  )
})

// 分页后的变量
const paginatedVariables = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredVariables.value.slice(start, end)
})

const getScopeType = (scope: string) => {
  switch (scope) {
    case 'system': return 'danger'
    case 'user': return 'primary'
    case 'process': return 'info'
    default: return ''
  }
}

const getScopeLabel = (scope: string) => {
  switch (scope) {
    case 'system': return '系统'
    case 'user': return '用户'
    case 'process': return '进程'
    default: return scope
  }
}

const handleImportAll = () => {
  emit('import-all')
}

const handleImportSingle = (variable: EnvVariable) => {
  emit('import-single', variable)
}

const handleAddVariable = () => {
  emit('add')
}

const handleEdit = async (variable: EnvVariable) => {
  if (!variable.scope || variable.scope === 'process') {
    ElMessage.warning('进程变量不可编辑')
    return
  }
  emit('edit', variable)
}

const handleDelete = async (variable: EnvVariable) => {
  if (!variable.scope || variable.scope === 'process') {
    ElMessage.warning('进程变量不可删除')
    return
  }
  emit('delete', variable)
}
</script>

<style scoped>
.env-variable-table {
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
</style>
