<template>
  <div class="validation-panel">
    <div class="validation-header">
      <h4>配置验证</h4>
      <el-button
        type="primary"
        size="small"
        @click="handleValidate"
      >
        <el-icon><CircleCheck /></el-icon>
        重新验证
      </el-button>
    </div>

    <div v-if="!validated" class="validation-prompt">
      <el-button type="info" @click="handleValidate">
        点击验证配置
      </el-button>
    </div>

    <div v-else class="validation-results">
      <div class="validation-summary">
        <el-alert
          v-if="summary.isValid"
          title="配置验证通过"
          type="success"
          :closable="false"
        >
          <template #default>
            所有环境变量配置正确，无错误和警告。
          </template>
        </el-alert>

        <el-alert
          v-else-if="summary.totalErrors > 0"
          title="发现配置错误"
          type="error"
          :closable="false"
        >
          <template #default>
            发现 <strong>{{ summary.totalErrors }}</strong> 个错误，
            <strong>{{ summary.totalWarnings }}</strong> 个警告。
            请修复后再使用此配置。
          </template>
        </el-alert>

        <el-alert
          v-else
          title="配置有警告"
          type="warning"
          :closable="false"
        >
          <template #default>
            发现 <strong>{{ summary.totalWarnings }}</strong> 个警告。
            建议修复后使用，但不影响基本功能。
          </template>
        </el-alert>
      </div>

      <div v-if="errors.length > 0" class="validation-errors">
        <el-divider />
        <h5>问题详情</h5>
        
        <div class="error-list">
          <div
            v-for="(error, index) in errors"
            :key="index"
            :class="['error-item', error.type]"
          >
            <el-icon v-if="error.type === 'error'">
              <CircleClose />
            </el-icon>
            <el-icon v-else>
              <Warning />
            </el-icon>
            <div class="error-content">
              <div class="error-key">{{ error.key }}</div>
              <div class="error-message">{{ error.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue'
import { VariableValidator } from '../utils/validator'
import type { EnvVariable, ValidationError } from '../types'

const props = defineProps<{
  variables: EnvVariable[]
}>()

const validated = ref(false)
const errors = ref<ValidationError[]>([])

const summary = computed(() => {
  return VariableValidator.getValidationSummary(props.variables)
})

const handleValidate = () => {
  errors.value = VariableValidator.validateProfile(props.variables)
  validated.value = true
}

// 自动验证（当变量改变时）
const autoValidate = () => {
  if (validated.value) {
    handleValidate()
  }
}

// 暴露方法给父组件
defineExpose({
  validate: handleValidate,
  autoValidate
})
</script>

<style scoped>
.validation-panel {
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.validation-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.validation-prompt {
  text-align: center;
  padding: 40px 0;
}

.validation-results {
  margin-top: 16px;
}

.validation-summary {
  margin-bottom: 16px;
}

.validation-errors h5 {
  margin: 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  align-items: flex-start;
}

.error-item.error {
  background: var(--el-color-error-light-9);
  border-left: 3px solid var(--el-color-error);
}

.error-item.warning {
  background: var(--el-color-warning-light-9);
  border-left: 3px solid var(--el-color-warning);
}

.error-item .el-icon {
  font-size: 20px;
  margin-top: 2px;
}

.error-item.error .el-icon {
  color: var(--el-color-error);
}

.error-item.warning .el-icon {
  color: var(--el-color-warning);
}

.error-content {
  flex: 1;
}

.error-key {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  font-family: 'Consolas', monospace;
}

.error-message {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
