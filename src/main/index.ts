import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { EnvManager } from './services/envManager'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 创建环境管理器实例
  const envManager = new EnvManager()

  // IPC 处理器
  ipcMain.handle('load-profiles', async () => {
    return envManager.loadProfiles()
  })

  ipcMain.handle('save-profiles', async (_, profiles) => {
    return envManager.saveProfiles(profiles)
  })

  ipcMain.handle('apply-profile', async (_, profile) => {
    return envManager.applyProfile(profile)
  })

  ipcMain.handle('import-from-file', async (_, format) => {
    const filters = format === 'json' 
      ? [{ name: 'JSON Files', extensions: ['json'] }]
      : [{ name: 'Env Files', extensions: ['env'] }]
    
    const filePath = await envManager.showOpenDialog(filters)
    if (!filePath) return null

    if (format === 'json') {
      const profiles = await envManager.importFromJson(filePath)
      return profiles ? { profiles } : null
    } else {
      const variables = await envManager.importFromEnv(filePath)
      return variables ? { variables } : null
    }
  })

  ipcMain.handle('export-to-file', async (_, profile, format) => {
    const defaultPath = `${profile.name}.${format}`
    const filePath = await envManager.showSaveDialog(defaultPath)
    if (!filePath) return false

    if (format === 'json') {
      return envManager.exportToJson(profile, filePath)
    } else {
      return envManager.exportToEnv(profile, filePath)
    }
  })

  ipcMain.handle('show-save-dialog', async (_, defaultPath) => {
    return envManager.showSaveDialog(defaultPath)
  })

  ipcMain.handle('show-open-dialog', async (_, filters) => {
    return envManager.showOpenDialog(filters)
  })

  ipcMain.handle('get-system-env', async () => {
    return envManager.getSystemEnvVariables()
  })

  ipcMain.handle('import-system-env', async () => {
    return envManager.importSystemEnvVariables()
  })

  // 环境配置文件相关
  ipcMain.handle('get-env-config-files', async () => {
    return envManager.getEnvConfigFiles()
  })

  ipcMain.handle('read-env-config-file', async (_, filePath) => {
    return envManager.readEnvConfigFile(filePath)
  })

  ipcMain.handle('write-env-config-file', async (_, filePath, content) => {
    return envManager.writeEnvConfigFile(filePath, content)
  })

  ipcMain.handle('parse-env-from-config', async (_, content) => {
    return envManager.parseEnvFromConfigFile(content)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
