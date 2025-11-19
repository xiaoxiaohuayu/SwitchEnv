<template>
  <header class="app-header glass">
    <div class="title-bar-drag-region"></div>
    <div class="header-content">
      <div class="left-section">
        <div class="breadcrumbs">
          <span class="crumb workspace">{{ props.workspace }}</span>
          <el-icon class="separator"><ArrowRight /></el-icon>
          <span class="crumb location">{{ props.location }}</span>
        </div>
      </div>

      <div class="center-section">
        <div class="status-pill" v-if="activeProfileName">
          <div class="status-dot active"></div>
          <span class="status-text">{{ activeProfileName }}</span>
        </div>
      </div>

      <div class="right-section">
        <div class="actions">
           <el-tooltip content="系统环境变量" placement="bottom">
            <div class="action-btn" @click="$emit('show-system-env')">
              <el-icon><Monitor /></el-icon>
            </div>
          </el-tooltip>
          
          <el-tooltip content="配置文件编辑器" placement="bottom">
            <div class="action-btn" @click="$emit('show-env-file')">
              <el-icon><Edit /></el-icon>
            </div>
          </el-tooltip>

          <div class="divider-vertical"></div>

          <el-dropdown trigger="click" @command="themeStore.setTheme">
            <div class="action-btn theme-toggle">
              <el-icon><component :is="currentThemeIcon" /></el-icon>
            </div>
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
        </div>
      </div>
    </div>
    
    <!-- Info Bar (Optional, can be toggled or shown below) -->
    <div class="info-bar" v-if="lastDiffSummary || envFilePath">
       <span v-if="envFilePath" class="info-item">
        <el-icon><Folder /></el-icon>
        {{ envFilePath }}
      </span>
      <span v-if="lastDiffSummary" class="info-item">
        <el-icon><DataAnalysis /></el-icon>
        {{ lastDiffSummary }}
      </span>
       <span v-if="activeProfileUpdatedAt" class="info-item">
        <el-icon><Timer /></el-icon>
        {{ formatDate(activeProfileUpdatedAt) }}
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ArrowRight, Monitor, Edit, Sunny, Moon, Position, Folder, DataAnalysis, Timer } from '@element-plus/icons-vue'
import { useThemeStore } from '../../stores/theme'

const props = defineProps<{
  activeProfileName: string | null
  activeProfileUpdatedAt: number | null
  envFilePath: string
  lastDiff: { added: any[]; changed: any[]; removed: any[] } | null
  systemEnvCount: number
  workspace: string
  location: string
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

const currentThemeIcon = computed(() => {
  return themeStore.effectiveTheme === 'dark' ? Moon : Sunny
})

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
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

onMounted(() => themeStore.init())
</script>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  width: 100%;
  z-index: 50;
  border-bottom: 1px solid var(--app-border-color);
  position: relative;
}

.title-bar-drag-region {
  height: 10px;
  width: 100%;
  -webkit-app-region: drag;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px 12px;
  height: 48px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--color-text-soft);
  -webkit-app-region: no-drag;
}

.crumb.workspace {
  font-weight: 500;
  color: var(--color-text);
}

.crumb.location {
  font-weight: 600;
  color: var(--color-text);
}

.separator {
  font-size: 12px;
  opacity: 0.5;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-dot.active {
  box-shadow: 0 0 8px currentColor;
}

.right-section {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.actions {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-background-mute);
  color: var(--color-text);
}

.divider-vertical {
  width: 1px;
  height: 16px;
  background: var(--app-border-color);
  margin: 0 4px;
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px 8px;
  font-size: 11px;
  color: var(--color-text-soft);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-dropdown-menu__item.active) {
  color: var(--el-color-primary);
  font-weight: 600;
  background-color: var(--el-color-primary-light-9);
}
</style>
