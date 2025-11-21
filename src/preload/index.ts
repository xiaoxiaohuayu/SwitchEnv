import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  loadProfiles: () => ipcRenderer.invoke('load-profiles'),
  saveProfiles: (profiles) => ipcRenderer.invoke('save-profiles', profiles),
  applyProfile: (profile) => ipcRenderer.invoke('apply-profile', profile),
  importFromFile: (format) => ipcRenderer.invoke('import-from-file', format),
  exportToFile: (profile, format) => ipcRenderer.invoke('export-to-file', profile, format),
  showSaveDialog: (defaultPath) => ipcRenderer.invoke('show-save-dialog', defaultPath),
  showOpenDialog: (filters) => ipcRenderer.invoke('show-open-dialog', filters),
  getSystemEnv: () => ipcRenderer.invoke('get-system-env'),
  getWindowsEnv: () => ipcRenderer.invoke('get-windows-env'),
  setWindowsEnv: (key, value, scope) => ipcRenderer.invoke('set-windows-env', key, value, scope),
  deleteWindowsEnv: (key, scope) => ipcRenderer.invoke('delete-windows-env', key, scope),
  setWindowsEnvBatch: (variables, scope) => ipcRenderer.invoke('set-windows-env-batch', variables, scope),
  importSystemEnv: () => ipcRenderer.invoke('import-system-env'),
  getEnvFilePath: () => ipcRenderer.invoke('get-env-file-path'),
  applyProfileToFile: (filePath, profile) => ipcRenderer.invoke('apply-profile-to-file', filePath, profile),
  updateTrayState: (state) => ipcRenderer.invoke('update-tray-state', state),
  // 环境配置文件相关
  getEnvConfigFiles: () => ipcRenderer.invoke('get-env-config-files'),
  readEnvConfigFile: (filePath) => ipcRenderer.invoke('read-env-config-file', filePath),
  writeEnvConfigFile: (filePath, content) => ipcRenderer.invoke('write-env-config-file', filePath, content),
  parseEnvFromConfig: (content) => ipcRenderer.invoke('parse-env-from-config', content)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
