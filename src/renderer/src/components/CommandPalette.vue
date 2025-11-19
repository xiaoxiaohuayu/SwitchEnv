<template>
  <div v-if="visible" class="command-palette-overlay" @click="close">
    <div class="command-palette" @click.stop>
      <div class="search-box">
        <el-icon class="search-icon"><Search /></el-icon>
        <input 
          ref="inputRef"
          v-model="query" 
          type="text" 
          placeholder="搜索配置或命令..." 
          @keydown.down.prevent="moveSelection(1)"
          @keydown.up.prevent="moveSelection(-1)"
          @keydown.enter.prevent="executeSelection"
          @keydown.esc="close"
        >
        <div class="shortcut-hint">Esc to close</div>
      </div>
      
      <div class="results-list" v-if="filteredItems.length > 0">
        <div 
          v-for="(item, index) in filteredItems" 
          :key="item.id"
          class="result-item"
          :class="{ active: index === selectedIndex }"
          @click="executeItem(item)"
          @mouseenter="selectedIndex = index"
        >
          <div class="item-icon">
            <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
          </div>
          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-desc" v-if="item.description">{{ item.description }}</div>
          </div>
          <div class="item-shortcut" v-if="item.shortcut">{{ item.shortcut }}</div>
        </div>
      </div>
      
      <div class="empty-state" v-else>
        <p>未找到相关结果</p>
      </div>
      
      <div class="palette-footer">
        <div class="footer-item">
          <span class="key">↵</span>
          <span class="label">选择</span>
        </div>
        <div class="footer-item">
          <span class="key">↑↓</span>
          <span class="label">导航</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Search, Document, Plus, Setting, Refresh } from '@element-plus/icons-vue'
import { useEnvStore } from '../stores/env'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'command': [action: string, payload?: any]
}>()

const envStore = useEnvStore()
const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: any
  shortcut?: string
  action: string
  payload?: any
  group: 'profiles' | 'commands'
}

const commands: CommandItem[] = [
  { id: 'cmd-new', title: '新建配置', description: '创建一个新的环境配置', icon: Plus, action: 'create', group: 'commands' },
  { id: 'cmd-import', title: '导入配置', description: '从文件导入', icon: Refresh, action: 'import', group: 'commands' },
  { id: 'cmd-settings', title: '设置', description: '打开应用设置', icon: Setting, action: 'settings', group: 'commands' },
]

const items = computed(() => {
  const profileItems: CommandItem[] = envStore.profiles.map(p => ({
    id: `profile-${p.id}`,
    title: p.name,
    description: p.description || '切换到此配置',
    icon: Document,
    action: 'activate',
    payload: p.id,
    group: 'profiles'
  }))
  
  return [...commands, ...profileItems]
})

const filteredItems = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return items.value
  
  return items.value.filter(item => 
    item.title.toLowerCase().includes(q) || 
    (item.description && item.description.toLowerCase().includes(q))
  )
})

const moveSelection = (step: number) => {
  const len = filteredItems.value.length
  if (len === 0) return
  selectedIndex.value = (selectedIndex.value + step + len) % len
}

const executeSelection = () => {
  if (filteredItems.value.length === 0) return
  executeItem(filteredItems.value[selectedIndex.value])
}

const executeItem = (item: CommandItem) => {
  emit('command', item.action, item.payload)
  close()
}

const close = () => {
  emit('update:visible', false)
  query.value = ''
  selectedIndex.value = 0
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 14vh;
}

.command-palette {
  width: 600px;
  max-width: 90vw;
  background: var(--app-card-bg);
  border: 1px solid var(--app-border-color);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.search-box {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--app-border-color);
  gap: 12px;
}

.search-icon {
  font-size: 20px;
  color: var(--color-text-soft);
}

.search-box input {
  flex: 1;
  background: none;
  border: none;
  font-size: 18px;
  color: var(--color-text);
  outline: none;
}

.shortcut-hint {
  font-size: 12px;
  color: var(--color-text-soft);
  padding: 4px 8px;
  background: var(--color-background-mute);
  border-radius: 4px;
}

.results-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s;
}

.result-item.active {
  background: var(--color-primary);
  color: white;
}

.result-item.active .item-desc,
.result-item.active .item-shortcut,
.result-item.active .item-icon {
  color: rgba(255, 255, 255, 0.8);
}

.item-icon {
  font-size: 18px;
  color: var(--color-text-soft);
  display: flex;
  align-items: center;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
}

.item-desc {
  font-size: 12px;
  color: var(--color-text-soft);
  margin-top: 2px;
}

.item-shortcut {
  font-size: 12px;
  color: var(--color-text-soft);
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--color-text-soft);
}

.palette-footer {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: var(--color-background-mute);
  border-top: 1px solid var(--app-border-color);
  font-size: 12px;
  color: var(--color-text-soft);
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.key {
  background: var(--app-card-bg);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--app-border-color);
  font-family: monospace;
}
</style>
