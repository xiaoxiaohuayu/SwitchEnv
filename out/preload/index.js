"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  loadProfiles: () => electron.ipcRenderer.invoke("load-profiles"),
  saveProfiles: (profiles) => electron.ipcRenderer.invoke("save-profiles", profiles),
  applyProfile: (profile) => electron.ipcRenderer.invoke("apply-profile", profile),
  importFromFile: (format) => electron.ipcRenderer.invoke("import-from-file", format),
  exportToFile: (profile, format) => electron.ipcRenderer.invoke("export-to-file", profile, format),
  showSaveDialog: (defaultPath) => electron.ipcRenderer.invoke("show-save-dialog", defaultPath),
  showOpenDialog: (filters) => electron.ipcRenderer.invoke("show-open-dialog", filters),
  getSystemEnv: () => electron.ipcRenderer.invoke("get-system-env"),
  importSystemEnv: () => electron.ipcRenderer.invoke("import-system-env"),
  // 环境配置文件相关
  getEnvConfigFiles: () => electron.ipcRenderer.invoke("get-env-config-files"),
  readEnvConfigFile: (filePath) => electron.ipcRenderer.invoke("read-env-config-file", filePath),
  writeEnvConfigFile: (filePath, content) => electron.ipcRenderer.invoke("write-env-config-file", filePath, content),
  parseEnvFromConfig: (content) => electron.ipcRenderer.invoke("parse-env-from-config", content)
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
