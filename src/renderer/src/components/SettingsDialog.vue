<template>
  <el-dialog
    :model-value="visible"
    title="设置"
    width="600px"
    :before-close="handleClose"
    class="settings-dialog"
  >
    <div class="settings-container">
      <el-tabs tab-position="left" style="height: 400px">
        <el-tab-pane label="通用">
          <div class="setting-section">
            <h3>外观</h3>
            <div class="setting-item">
              <span class="label">主题模式</span>
              <el-select v-model="settings.theme" @change="applyTheme">
                <el-option label="跟随系统" value="auto" />
                <el-option label="浅色" value="light" />
                <el-option label="深色" value="dark" />
              </el-select>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>启动</h3>
            <div class="setting-item">
              <span class="label">开机自启</span>
              <el-switch v-model="settings.autoStart" />
            </div>
            <div class="setting-item">
              <span class="label">启动时隐藏窗口</span>
              <el-switch v-model="settings.startHidden" />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="编辑器">
          <div class="setting-section">
            <h3>显示</h3>
            <div class="setting-item">
              <span class="label">字体大小</span>
              <el-input-number v-model="settings.fontSize" :min="12" :max="24" />
            </div>
            <div class="setting-item">
              <span class="label">显示行号</span>
              <el-switch v-model="settings.showLineNumbers" />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="关于">
          <div class="about-section">
            <img src="../assets/electron.svg" alt="Logo" class="logo" />
            <h2>SwitchEnv</h2>
            <p class="version">v1.0.0</p>
            <p class="desc">现代化的环境变量管理工具</p>
            
            <div class="links">
              <el-button link type="primary">检查更新</el-button>
              <el-button link type="primary">GitHub</el-button>
            </div>
            
            <div class="copyright">
              &copy; 2025 SwitchEnv Team. All rights reserved.
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const settings = reactive({
  theme: 'auto',
  autoStart: false,
  startHidden: false,
  fontSize: 14,
  showLineNumbers: true
})

const handleClose = () => {
  emit('update:visible', false)
}

const applyTheme = (theme: string) => {
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
  } else if (theme === 'light') {
    html.classList.remove('dark')
  } else {
    // Auto
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }
  localStorage.setItem('switchenv-theme', theme)
}

// Load settings
onMounted(() => {
  const savedTheme = localStorage.getItem('switchenv-theme')
  if (savedTheme) {
    settings.theme = savedTheme
    applyTheme(savedTheme)
  }
})

watch(settings, (newSettings) => {
  localStorage.setItem('switchenv-settings', JSON.stringify(newSettings))
}, { deep: true })

</script>

<style scoped>
.settings-container {
  padding: 0 20px;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-section h3 {
  font-size: 14px;
  color: var(--color-text-soft);
  margin-bottom: 16px;
  font-weight: 600;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.setting-item .label {
  color: var(--color-text);
  font-size: 14px;
}

.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  text-align: center;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.about-section h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.version {
  color: var(--color-text-soft);
  margin-bottom: 8px;
}

.desc {
  color: var(--color-text-soft);
  margin-bottom: 24px;
}

.links {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.copyright {
  font-size: 12px;
  color: var(--color-text-soft);
}
</style>
