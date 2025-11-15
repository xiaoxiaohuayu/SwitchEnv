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
  importSystemEnv: () => ipcRenderer.invoke('import-system-env')
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
