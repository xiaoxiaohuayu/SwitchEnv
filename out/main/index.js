"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const fs = require("fs");
const os = require("os");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const icon = path.join(__dirname, "../../resources/icon.png");
class EnvManager {
  configPath;
  envFilePath;
  constructor() {
    const userDataPath = electron.app.getPath("userData");
    this.configPath = path__namespace.join(userDataPath, "profiles.json");
    this.envFilePath = path__namespace.join(userDataPath, ".env");
    this.ensureConfigFile();
  }
  ensureConfigFile() {
    if (!fs__namespace.existsSync(this.configPath)) {
      fs__namespace.writeFileSync(this.configPath, JSON.stringify([]), "utf-8");
    }
  }
  // 加载所有配置
  loadProfiles() {
    try {
      const data = fs__namespace.readFileSync(this.configPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load profiles:", error);
      return [];
    }
  }
  // 保存所有配置
  saveProfiles(profiles) {
    try {
      fs__namespace.writeFileSync(this.configPath, JSON.stringify(profiles, null, 2), "utf-8");
      return true;
    } catch (error) {
      console.error("Failed to save profiles:", error);
      return false;
    }
  }
  // 应用配置（将环境变量写入 .env 文件）
  applyProfile(profile) {
    try {
      const envContent = profile.variables.map((v) => `${v.key}=${v.value}`).join("\n");
      fs__namespace.writeFileSync(this.envFilePath, envContent, "utf-8");
      profile.variables.forEach((v) => {
        process.env[v.key] = v.value;
      });
      return true;
    } catch (error) {
      console.error("Failed to apply profile:", error);
      return false;
    }
  }
  // 从 JSON 文件导入
  async importFromJson(filePath) {
    try {
      const data = fs__namespace.readFileSync(filePath, "utf-8");
      const profiles = JSON.parse(data);
      if (Array.isArray(profiles)) {
        return profiles.map((p) => ({
          ...p,
          id: Date.now().toString() + Math.random(),
          isActive: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }));
      } else if (profiles.id && profiles.name) {
        return [{
          ...profiles,
          id: Date.now().toString(),
          isActive: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }];
      }
      return null;
    } catch (error) {
      console.error("Failed to import from JSON:", error);
      return null;
    }
  }
  // 从 .env 文件导入
  async importFromEnv(filePath) {
    try {
      const data = fs__namespace.readFileSync(filePath, "utf-8");
      const variables = [];
      data.split("\n").forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith("#")) {
          const [key, ...valueParts] = line.split("=");
          if (key) {
            variables.push({
              key: key.trim(),
              value: valueParts.join("=").trim()
            });
          }
        }
      });
      return variables;
    } catch (error) {
      console.error("Failed to import from .env:", error);
      return null;
    }
  }
  // 导出为 JSON
  async exportToJson(profile, filePath) {
    try {
      fs__namespace.writeFileSync(filePath, JSON.stringify(profile, null, 2), "utf-8");
      return true;
    } catch (error) {
      console.error("Failed to export to JSON:", error);
      return false;
    }
  }
  // 导出为 .env
  async exportToEnv(profile, filePath) {
    try {
      const envContent = profile.variables.map((v) => `${v.key}=${v.value}`).join("\n");
      fs__namespace.writeFileSync(filePath, envContent, "utf-8");
      return true;
    } catch (error) {
      console.error("Failed to export to .env:", error);
      return false;
    }
  }
  // 显示保存对话框
  async showSaveDialog(defaultPath) {
    const result = await electron.dialog.showSaveDialog({
      defaultPath,
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "Env Files", extensions: ["env"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return result.canceled ? null : result.filePath || null;
  }
  // 显示打开对话框
  async showOpenDialog(filters) {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile"],
      filters
    });
    return result.canceled ? null : result.filePaths[0] || null;
  }
  // 获取 .env 文件路径
  getEnvFilePath() {
    return this.envFilePath;
  }
  // 获取系统环境变量
  getSystemEnvVariables() {
    const variables = [];
    const env = process.env;
    console.log("[EnvManager] 开始获取系统环境变量...");
    console.log("[EnvManager] process.env 包含", Object.keys(env).length, "个键");
    for (const [key, value] of Object.entries(env)) {
      if (value !== void 0) {
        variables.push({
          key,
          value
        });
      }
    }
    console.log("[EnvManager] 提取了", variables.length, "个有效环境变量");
    return variables.sort((a, b) => a.key.localeCompare(b.key));
  }
  // 获取 Windows 环境变量(区分系统和用户)
  getWindowsEnvVariables() {
    const result = {
      system: [],
      user: [],
      process: []
    };
    if (process.platform !== "win32") {
      console.log("[EnvManager] 非 Windows 平台,无法区分系统和用户变量");
      return result;
    }
    try {
      const { execSync } = require("child_process");
      console.log("[EnvManager] 正在读取系统环境变量...");
      const systemEnvCmd = `powershell -Command "[Environment]::GetEnvironmentVariables('Machine') | ConvertTo-Json"`;
      const systemEnvOutput = execSync(systemEnvCmd, { encoding: "utf-8" });
      const systemEnv = JSON.parse(systemEnvOutput);
      for (const [key, value] of Object.entries(systemEnv)) {
        if (value !== void 0 && value !== null) {
          result.system.push({
            key,
            value: String(value),
            scope: "system"
          });
        }
      }
      console.log("[EnvManager] 系统变量:", result.system.length, "个");
      console.log("[EnvManager] 正在读取用户环境变量...");
      const userEnvCmd = `powershell -Command "[Environment]::GetEnvironmentVariables('User') | ConvertTo-Json"`;
      const userEnvOutput = execSync(userEnvCmd, { encoding: "utf-8" });
      const userEnv = JSON.parse(userEnvOutput);
      for (const [key, value] of Object.entries(userEnv)) {
        if (value !== void 0 && value !== null) {
          result.user.push({
            key,
            value: String(value),
            scope: "user"
          });
        }
      }
      console.log("[EnvManager] 用户变量:", result.user.length, "个");
      console.log("[EnvManager] 正在读取进程环境变量...");
      const systemKeys = new Set(result.system.map((v) => v.key));
      const userKeys = new Set(result.user.map((v) => v.key));
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== void 0 && !systemKeys.has(key) && !userKeys.has(key)) {
          result.process.push({
            key,
            value,
            scope: "process"
          });
        }
      }
      console.log("[EnvManager] 进程变量:", result.process.length, "个");
      result.system.sort((a, b) => a.key.localeCompare(b.key));
      result.user.sort((a, b) => a.key.localeCompare(b.key));
      result.process.sort((a, b) => a.key.localeCompare(b.key));
    } catch (error) {
      console.error("[EnvManager] 获取 Windows 环境变量失败:", error);
    }
    return result;
  }
  // 导入系统环境变量到新配置
  importSystemEnvVariables() {
    const systemVars = this.getSystemEnvVariables();
    const profile = {
      id: "system-" + Date.now().toString(),
      name: "系统环境变量",
      description: "从本机系统导入的环境变量",
      variables: systemVars,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return profile;
  }
  // 获取系统环境配置文件列表
  getEnvConfigFiles() {
    const homeDir = os__namespace.homedir();
    const platform = process.platform;
    const files = [];
    if (platform === "darwin" || platform === "linux") {
      const possibleFiles = [
        { name: ".bashrc", path: path__namespace.join(homeDir, ".bashrc"), description: "Bash 配置文件" },
        { name: ".bash_profile", path: path__namespace.join(homeDir, ".bash_profile"), description: "Bash Profile" },
        { name: ".zshrc", path: path__namespace.join(homeDir, ".zshrc"), description: "Zsh 配置文件" },
        { name: ".profile", path: path__namespace.join(homeDir, ".profile"), description: "Shell Profile" },
        { name: ".zprofile", path: path__namespace.join(homeDir, ".zprofile"), description: "Zsh Profile" },
        { name: "/etc/profile", path: "/etc/profile", description: "系统级 Shell Profile" },
        { name: "/etc/zshrc", path: "/etc/zshrc", description: "系统级 Zsh 配置" },
        { name: "/etc/bashrc", path: "/etc/bashrc", description: "系统级 Bash 配置" },
        { name: "/etc/environment", path: "/etc/environment", description: "系统环境变量文件 (部分发行版)" }
      ];
      possibleFiles.forEach((file) => {
        if (fs__namespace.existsSync(file.path)) {
          files.push(file);
        }
      });
    } else if (platform === "win32") {
      const userProfile = process.env.USERPROFILE || homeDir;
      const possibleFiles = [
        {
          name: "PowerShell Profile (当前用户)",
          path: path__namespace.join(userProfile, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1"),
          description: "PowerShell 用户配置文件"
        },
        {
          name: "PowerShell Profile (所有用户)",
          path: path__namespace.join(userProfile, "Documents", "WindowsPowerShell", "Microsoft.PowerShell_profile.ps1"),
          description: "PowerShell 用户配置文件 (旧版)"
        },
        {
          name: ".bashrc (Git Bash)",
          path: path__namespace.join(userProfile, ".bashrc"),
          description: "Git Bash 配置（若已安装）"
        },
        {
          name: ".bash_profile (Git Bash)",
          path: path__namespace.join(userProfile, ".bash_profile"),
          description: "Git Bash Profile（若已安装）"
        }
      ];
      possibleFiles.forEach((file) => {
        if (fs__namespace.existsSync(file.path)) {
          files.push(file);
        }
      });
    }
    return files;
  }
  // 读取环境配置文件内容
  readEnvConfigFile(filePath) {
    try {
      if (fs__namespace.existsSync(filePath)) {
        return fs__namespace.readFileSync(filePath, "utf-8");
      }
      return null;
    } catch (error) {
      console.error("Failed to read env config file:", error);
      return null;
    }
  }
  // 写入环境配置文件
  writeEnvConfigFile(filePath, content) {
    try {
      if (fs__namespace.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs__namespace.copyFileSync(filePath, backupPath);
        console.log("[EnvManager] 已备份原文件到:", backupPath);
      }
      fs__namespace.writeFileSync(filePath, content, "utf-8");
      console.log("[EnvManager] 成功写入配置文件:", filePath);
      return true;
    } catch (error) {
      console.error("Failed to write env config file:", error);
      return false;
    }
  }
  // 将配置应用到指定的系统配置文件（追加 SwitchEnv 块）
  applyProfileToFile(filePath, profile) {
    try {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const header = `
# ----- SwitchEnv (${timestamp}) -----
`;
      const footer = "# ----- End SwitchEnv -----\n";
      const lines = profile.variables.map((v) => {
        const safeValue = (v.value ?? "").replace(/"/g, '\\"');
        return `export ${v.key}="${safeValue}"`;
      });
      const block = `${header}${lines.join("\n")}
${footer}`;
      if (fs__namespace.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs__namespace.copyFileSync(filePath, backupPath);
        console.log("[EnvManager] 已备份原文件到:", backupPath);
      }
      fs__namespace.appendFileSync(filePath, block, "utf-8");
      console.log("[EnvManager] 已将配置写入:", filePath);
      return true;
    } catch (error) {
      console.error("Failed to apply profile to file:", error);
      return false;
    }
  }
  // 从配置文件中提取环境变量
  parseEnvFromConfigFile(content) {
    const variables = [];
    const lines = content.split("\n");
    const exportPattern = /^\s*export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;
    const varPattern = /^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;
    lines.forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith("#")) return;
      let match = line.match(exportPattern);
      if (!match) {
        match = line.match(varPattern);
      }
      if (match) {
        const key = match[1];
        let value = match[2];
        value = value.replace(/^["']|["']$/g, "");
        variables.push({ key, value });
      }
    });
    return variables;
  }
}
let mainWindow = null;
let tray = null;
let trayState = {
  activeProfile: null,
  recentProfiles: []
};
const handleProfileSwitchRequest = (profileId) => {
  if (!profileId || !mainWindow) return;
  mainWindow.webContents.send("switch-profile", profileId);
  mainWindow.show();
};
const buildTrayMenu = () => {
  if (!tray) return;
  const menuTemplate = [
    {
      label: trayState.activeProfile ? `当前：${trayState.activeProfile.name}` : "当前：未激活",
      enabled: false
    },
    { type: "separator" }
  ];
  if (trayState.recentProfiles.length === 0) {
    menuTemplate.push({ label: "暂无可用配置", enabled: false });
  } else {
    trayState.recentProfiles.forEach((profile) => {
      menuTemplate.push({
        label: profile.name,
        click: () => handleProfileSwitchRequest(profile.id)
      });
    });
  }
  menuTemplate.push(
    { type: "separator" },
    {
      label: "显示应用窗口",
      click: () => mainWindow?.show()
    },
    {
      label: "退出 SwitchEnv",
      click: () => electron.app.quit()
    }
  );
  tray.setContextMenu(electron.Menu.buildFromTemplate(menuTemplate));
};
const buildAppMenu = () => {
  const quickSwitchItems = [
    {
      label: trayState.activeProfile ? `当前：${trayState.activeProfile.name}` : "当前：未激活",
      enabled: false
    },
    { type: "separator" }
  ];
  if (trayState.recentProfiles.length === 0) {
    quickSwitchItems.push({ label: "暂无可切换配置", enabled: false });
  } else {
    trayState.recentProfiles.forEach((profile, index) => {
      quickSwitchItems.push({
        label: `${index + 1}. ${profile.name}`,
        accelerator: `CommandOrControl+Alt+${index + 1}`,
        click: () => handleProfileSwitchRequest(profile.id)
      });
    });
  }
  const template = [
    {
      label: "SwitchEnv",
      submenu: [
        ...quickSwitchItems,
        { type: "separator" },
        {
          label: "显示窗口",
          accelerator: "CommandOrControl+Shift+S",
          click: () => mainWindow?.show()
        },
        { role: "quit" }
      ]
    },
    { role: "editMenu" },
    { role: "viewMenu" }
  ];
  electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(template));
};
const registerProfileShortcuts = () => {
  electron.globalShortcut.unregisterAll();
  trayState.recentProfiles.slice(0, 5).forEach((profile, index) => {
    const accelerator = `CommandOrControl+Alt+${index + 1}`;
    try {
      electron.globalShortcut.register(accelerator, () => handleProfileSwitchRequest(profile.id));
    } catch (error) {
      console.warn("Failed to register shortcut", accelerator, error);
    }
  });
};
const createTray = () => {
  if (tray) return;
  const trayIcon = electron.nativeImage.createFromPath(icon).resize({ width: 16, height: 16 });
  trayIcon.setTemplateImage(true);
  tray = new electron.Tray(trayIcon);
  tray.setToolTip("SwitchEnv");
  tray.on("click", () => {
    mainWindow?.show();
  });
  buildTrayMenu();
};
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("context-menu", (_event, params) => {
    const contextMenuTemplate = [];
    if (params.isEditable) {
      contextMenuTemplate.push(
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
        { role: "delete", label: "删除" },
        { type: "separator" },
        { role: "selectAll", label: "全选" }
      );
    } else if (params.selectionText) {
      contextMenuTemplate.push(
        { role: "copy", label: "复制" }
      );
    }
    if (contextMenuTemplate.length > 0) {
      contextMenuTemplate.push({ type: "separator" });
    }
    contextMenuTemplate.push(
      {
        label: "刷新",
        accelerator: "CommandOrControl+R",
        click: () => {
          mainWindow?.webContents.reload();
        }
      },
      {
        label: "强制重载",
        accelerator: "CommandOrControl+Shift+R",
        click: () => {
          mainWindow?.webContents.reloadIgnoringCache();
        }
      }
    );
    if (utils.is.dev) {
      contextMenuTemplate.push(
        { type: "separator" },
        {
          label: "开发者工具",
          accelerator: "F12",
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          }
        },
        {
          label: "检查元素",
          click: () => {
            mainWindow?.webContents.inspectElement(params.x, params.y);
          }
        }
      );
    }
    const contextMenu = electron.Menu.buildFromTemplate(contextMenuTemplate);
    contextMenu.popup();
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  electron.app.on("will-quit", () => {
    electron.globalShortcut.unregisterAll();
  });
  const envManager = new EnvManager();
  createTray();
  buildAppMenu();
  registerProfileShortcuts();
  electron.ipcMain.handle("load-profiles", async () => {
    return envManager.loadProfiles();
  });
  electron.ipcMain.handle("save-profiles", async (_, profiles) => {
    return envManager.saveProfiles(profiles);
  });
  electron.ipcMain.handle("apply-profile", async (_, profile) => {
    return envManager.applyProfile(profile);
  });
  electron.ipcMain.handle("import-from-file", async (_, format) => {
    const filters = format === "json" ? [{ name: "JSON Files", extensions: ["json"] }] : [{ name: "Env Files", extensions: ["env"] }];
    const filePath = await envManager.showOpenDialog(filters);
    if (!filePath) return null;
    if (format === "json") {
      const profiles = await envManager.importFromJson(filePath);
      return profiles ? { profiles } : null;
    } else {
      const variables = await envManager.importFromEnv(filePath);
      return variables ? { variables } : null;
    }
  });
  electron.ipcMain.handle("export-to-file", async (_, profile, format) => {
    const defaultPath = `${profile.name}.${format}`;
    const filePath = await envManager.showSaveDialog(defaultPath);
    if (!filePath) return false;
    if (format === "json") {
      return envManager.exportToJson(profile, filePath);
    } else {
      return envManager.exportToEnv(profile, filePath);
    }
  });
  electron.ipcMain.handle("show-save-dialog", async (_, defaultPath) => {
    return envManager.showSaveDialog(defaultPath);
  });
  electron.ipcMain.handle("show-open-dialog", async (_, filters) => {
    return envManager.showOpenDialog(filters);
  });
  electron.ipcMain.handle("get-system-env", async () => {
    return envManager.getSystemEnvVariables();
  });
  electron.ipcMain.handle("get-windows-env", async () => {
    return envManager.getWindowsEnvVariables();
  });
  electron.ipcMain.handle("import-system-env", async () => {
    return envManager.importSystemEnvVariables();
  });
  electron.ipcMain.handle("get-env-file-path", async () => {
    return envManager.getEnvFilePath();
  });
  electron.ipcMain.handle("apply-profile-to-file", async (_, filePath, profile) => {
    return envManager.applyProfileToFile(filePath, profile);
  });
  electron.ipcMain.handle("update-tray-state", async (_, state) => {
    trayState = state || { activeProfile: null, recentProfiles: [] };
    buildTrayMenu();
    buildAppMenu();
    registerProfileShortcuts();
  });
  electron.ipcMain.handle("get-env-config-files", async () => {
    return envManager.getEnvConfigFiles();
  });
  electron.ipcMain.handle("read-env-config-file", async (_, filePath) => {
    return envManager.readEnvConfigFile(filePath);
  });
  electron.ipcMain.handle("write-env-config-file", async (_, filePath, content) => {
    return envManager.writeEnvConfigFile(filePath, content);
  });
  electron.ipcMain.handle("parse-env-from-config", async (_, content) => {
    return envManager.parseEnvFromConfigFile(content);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
