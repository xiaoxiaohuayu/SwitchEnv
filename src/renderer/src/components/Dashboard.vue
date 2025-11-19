<template>
  <div class="dashboard">
    <div class="hero-section">
      <div class="greeting-container">
        <h1 class="greeting">{{ greeting }}</h1>
        <p class="subtitle">准备好管理您的环境变量了吗？</p>
      </div>
      <div class="hero-decoration">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 快速操作 -->
      <div class="section quick-actions">
        <h2 class="section-title">快速开始</h2>
        <div class="action-cards">
          <div class="action-card" @click="$emit('create')">
            <div class="icon-wrapper primary">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="card-content">
              <h3>新建配置</h3>
              <p>创建一个新的环境配置</p>
            </div>
          </div>
          
          <div class="action-card" @click="$emit('import')">
            <div class="icon-wrapper success">
              <el-icon><Upload /></el-icon>
            </div>
            <div class="card-content">
              <h3>导入配置</h3>
              <p>从 .env 或 JSON 导入</p>
            </div>
          </div>

          <div class="action-card" @click="$emit('show-system-env')">
            <div class="icon-wrapper warning">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="card-content">
              <h3>系统变量</h3>
              <p>查看本机系统环境变量</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近使用 -->
      <div class="section recent-activity" v-if="recentProfiles.length > 0">
        <h2 class="section-title">最近使用</h2>
        <div class="recent-list">
          <div 
            v-for="profile in recentProfiles" 
            :key="profile.id" 
            class="recent-item"
            @click="$emit('select', profile.id)"
          >
            <div class="recent-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="recent-info">
              <span class="name">{{ profile.name }}</span>
              <span class="time">{{ formatDate(profile.updatedAt) }}</span>
            </div>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Upload, Monitor, Document, ArrowRight } from '@element-plus/icons-vue'
import type { EnvProfile } from '../types'

defineProps<{
  recentProfiles: EnvProfile[]
}>()

defineEmits<{
  create: []
  import: []
  'show-system-env': []
  select: [id: string]
}>()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.dashboard {
  height: 100%;
  padding: 40px;
  overflow-y: auto;
  background: var(--color-background-mute);
  position: relative;
}

.hero-section {
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.greeting {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-text) 0%, var(--color-text-soft) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: var(--color-text-soft);
}

.hero-decoration {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  z-index: -1;
  opacity: 0.5;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.blob-1 {
  width: 300px;
  height: 300px;
  background: rgba(59, 130, 246, 0.15);
  top: 0;
  right: 0;
  animation: float 10s infinite ease-in-out;
}

.blob-2 {
  width: 200px;
  height: 200px;
  background: rgba(139, 92, 246, 0.15);
  bottom: 50px;
  left: 50px;
  animation: float 8s infinite ease-in-out reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, 20px); }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-soft);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-cards {
  display: grid;
  gap: 16px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--app-card-bg);
  border: 1px solid var(--app-border-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-200);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.icon-wrapper.primary {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.icon-wrapper.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.icon-wrapper.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text);
}

.card-content p {
  font-size: 13px;
  color: var(--color-text-soft);
}

.recent-list {
  background: var(--app-card-bg);
  border: 1px solid var(--app-border-color);
  border-radius: 16px;
  overflow: hidden;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--app-border-color);
  cursor: pointer;
  transition: background 0.2s;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-item:hover {
  background: var(--color-background-mute);
}

.recent-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recent-info .name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.recent-info .time {
  font-size: 12px;
  color: var(--color-text-soft);
}

.arrow {
  color: var(--color-text-soft);
  font-size: 14px;
}
</style>
