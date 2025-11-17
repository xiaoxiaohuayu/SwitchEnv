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
        { name: ".zprofile", path: path__namespace.join(homeDir, ".zprofile"), description: "Zsh Profile" }
      ];
      possibleFiles.forEach((file) => {
        if (fs__namespace.existsSync(file.path)) {
          files.push(file);
        }
      });
    } else if (platform === "win32") {
      files.push({
        name: "系统环境变量",
        path: "HKEY_CURRENT_USER\\Environment",
        description: "Windows 用户环境变量（注册表）"
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
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
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
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
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
  const envManager = new EnvManager();
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
  electron.ipcMain.handle("import-system-env", async () => {
    return envManager.importSystemEnvVariables();
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
