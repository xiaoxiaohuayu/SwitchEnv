<template>
  <header class="app-header">
    <div class="title-area">
      <div>
        <h1>SwitchEnv</h1>
        <p>环境变量管理工具</p>
      </div>
      <div class="status-line">
        <el-tag v-if="activeProfileName" type="success" effect="dark">
          当前激活：{{ activeProfileName }}
        </el-tag>
        <el-tag v-else type="info" effect="dark">暂无激活配置</el-tag>
        <span v-if="activeProfileUpdatedAt" class="status-pill">
          更新时间：{{ formatDate(activeProfileUpdatedAt) }}
        </span>
        <span v-if="envFilePath" class="status-pill">
          写入位置：{{ envFilePath }}
        </span>
        <span v-if="lastDiffSummary" class="status-pill">
          上次切换：{{ lastDiffSummary }}
        </span>
      </div>
    </div>
    <div class="header-actions">
      <el-dropdown trigger="click" @command="themeStore.setTheme">
        <el-button text>
          <el-icon><component :is="currentThemeIcon" /></el-icon>
          {{ currentThemeInfo?.label || '主题' }}
          <el-icon class="chevron"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="option in themeOptions"
              :key="option.value"
              :command="option.value"
              :class="{ active: option.value === themeStore.theme }"
            >
              <el-icon><component :is="option.icon" /></el-icon>
              <span class="dropdown-label">{{ option.label }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button text @click="$emit('show-system-env')">
        <el-icon><Monitor /></el-icon>
        系统环境变量 ({{ systemEnvCount }})
      </el-button>
      <el-button text @click="$emit('show-env-file')">
        <el-icon><Edit /></el-icon>
        配置文件编辑器
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, Monitor, Edit, Sunny, Moon, Position } from '@element-plus/icons-vue'
import { useThemeStore } from '../../stores/theme'

const props = defineProps<{
  activeProfileName: string | null
  activeProfileUpdatedAt: number | null
  envFilePath: string
  lastDiff: { added: any[]; changed: any[]; removed: any[] } | null
  systemEnvCount: number
}>()

defineEmits<{
  'show-system-env': []
  'show-env-file': []
}>()

const themeStore = useThemeStore()

const themeOptions = [
  { label: '浅色', value: 'light', icon: Sunny },
  { label: '深色', value: 'dark', icon: Moon },
  { label: '跟随系统', value: 'system', icon: Position }
]

const currentThemeInfo = computed(() => {
  return themeOptions.find(option => option.value === themeStore.theme)
})

const currentThemeIcon = computed(() => {
  return themeStore.effectiveTheme === 'dark' ? Moon : Sunny
})

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const lastDiffSummary = computed(() => {
  if (!props.lastDiff) return ''
  return `+${props.lastDiff.added.length} ~${props.lastDiff.changed.length} -${props.lastDiff.removed.length}`
})
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 18px 24px;
  background: var(--app-header-bg);
  color: var(--app-header-text);
  box-shadow: 0 8px 20px rgba(14, 26, 77, 0.18);
}

.title-area h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.title-area p {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.85;
}

.status-line {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.status-pill {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: var(--app-header-text);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.header-actions :deep(.el-button) {
  color: var(--app-header-text);
}

.header-actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.16);
}

.dropdown-label {
  margin-left: 6px;
}

.chevron {
  margin-left: 2px;
}

:deep(.el-dropdown-menu__item.active) {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
