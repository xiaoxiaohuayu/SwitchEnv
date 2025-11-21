import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  globalShortcut,
  nativeImage,
  type MenuItemConstructorOptions
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { EnvManager } from './services/envManager'

interface TrayProfileInfo {
  id: string
  name: string
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let trayState: {
  activeProfile: TrayProfileInfo | null
  recentProfiles: TrayProfileInfo[]
} = {
  activeProfile: null,
  recentProfiles: []
}

const handleProfileSwitchRequest = (profileId: string) => {
  if (!profileId || !mainWindow) return
  mainWindow.webContents.send('switch-profile', profileId)
  mainWindow.show()
}

const buildTrayMenu = () => {
  if (!tray) return
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: trayState.activeProfile ? `当前：${trayState.activeProfile.name}` : '当前：未激活',
      enabled: false
    },
    { type: 'separator' }
  ]

  if (trayState.recentProfiles.length === 0) {
    menuTemplate.push({ label: '暂无可用配置', enabled: false })
  } else {
    trayState.recentProfiles.forEach((profile) => {
      menuTemplate.push({
        label: profile.name,
        click: () => handleProfileSwitchRequest(profile.id)
      })
    })
  }

  menuTemplate.push(
    { type: 'separator' },
    {
      label: '显示应用窗口',
      click: () => mainWindow?.show()
    },
    {
      label: '退出 SwitchEnv',
      click: () => app.quit()
    }
  )

  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate))
}

const buildAppMenu = () => {
  const quickSwitchItems: MenuItemConstructorOptions[] = [
    {
      label: trayState.activeProfile ? `当前：${trayState.activeProfile.name}` : '当前：未激活',
      enabled: false
    },
    { type: 'separator' }
  ]

  if (trayState.recentProfiles.length === 0) {
    quickSwitchItems.push({ label: '暂无可切换配置', enabled: false })
  } else {
    trayState.recentProfiles.forEach((profile, index) => {
      quickSwitchItems.push({
        label: `${index + 1}. ${profile.name}`,
        accelerator: `CommandOrControl+Alt+${index + 1}`,
        click: () => handleProfileSwitchRequest(profile.id)
      })
    })
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'SwitchEnv',
      submenu: [
        ...quickSwitchItems,
        { type: 'separator' },
        {
          label: '显示窗口',
          accelerator: 'CommandOrControl+Shift+S',
          click: () => mainWindow?.show()
        },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

const registerProfileShortcuts = () => {
  globalShortcut.unregisterAll()
  trayState.recentProfiles.slice(0, 5).forEach((profile, index) => {
    const accelerator = `CommandOrControl+Alt+${index + 1}`
    try {
      globalShortcut.register(accelerator, () => handleProfileSwitchRequest(profile.id))
    } catch (error) {
      console.warn('Failed to register shortcut', accelerator, error)
    }
  })
}

const createTray = () => {
  if (tray) return
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)
  tray.setToolTip('SwitchEnv')
  tray.on('click', () => {
    mainWindow?.show()
  })
  buildTrayMenu()
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 添加右键菜单
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const contextMenuTemplate: MenuItemConstructorOptions[] = []

    // 如果是可编辑区域，添加编辑相关菜单
    if (params.isEditable) {
      contextMenuTemplate.push(
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'delete', label: '删除' },
        { type: 'separator' },
        { role: 'selectAll', label: '全选' }
      )
    } else if (params.selectionText) {
      // 如果有选中文本，显示复制
      contextMenuTemplate.push(
        { role: 'copy', label: '复制' }
      )
    }

    // 添加分隔线（如果前面有内容）
    if (contextMenuTemplate.length > 0) {
      contextMenuTemplate.push({ type: 'separator' })
    }

    // 添加刷新和重载菜单
    contextMenuTemplate.push(
      {
        label: '刷新',
        accelerator: 'CommandOrControl+R',
        click: () => {
          mainWindow?.webContents.reload()
        }
      },
      {
        label: '强制重载',
        accelerator: 'CommandOrControl+Shift+R',
        click: () => {
          mainWindow?.webContents.reloadIgnoringCache()
        }
      }
    )

    // 开发模式下添加开发者工具
    if (is.dev) {
      contextMenuTemplate.push(
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            mainWindow?.webContents.toggleDevTools()
          }
        },
        {
          label: '检查元素',
          click: () => {
            mainWindow?.webContents.inspectElement(params.x, params.y)
          }
        }
      )
    }

    const contextMenu = Menu.buildFromTemplate(contextMenuTemplate)
    contextMenu.popup()
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

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  // 创建环境管理器实例
  const envManager = new EnvManager()

  createTray()
  buildAppMenu()
  registerProfileShortcuts()

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

  // 获取 Windows 环境变量(区分系统和用户)
  ipcMain.handle('get-windows-env', async () => {
    return envManager.getWindowsEnvVariables()
  })

  // 设置 Windows 环境变量
  ipcMain.handle('set-windows-env', async (_, key: string, value: string, scope: 'system' | 'user') => {
    return envManager.setWindowsEnvVariable(key, value, scope)
  })

  // 删除 Windows 环境变量
  ipcMain.handle('delete-windows-env', async (_, key: string, scope: 'system' | 'user') => {
    return envManager.deleteWindowsEnvVariable(key, scope)
  })

  // 批量设置 Windows 环境变量
  ipcMain.handle('set-windows-env-batch', async (_, variables: any[], scope: 'system' | 'user') => {
    return envManager.setWindowsEnvVariables(variables, scope)
  })

  ipcMain.handle('import-system-env', async () => {
    return envManager.importSystemEnvVariables()
  })

  ipcMain.handle('get-env-file-path', async () => {
    return envManager.getEnvFilePath()
  })

  ipcMain.handle('apply-profile-to-file', async (_, filePath, profile) => {
    return envManager.applyProfileToFile(filePath, profile)
  })

  ipcMain.handle('update-tray-state', async (_, state) => {
    trayState = state || { activeProfile: null, recentProfiles: [] }
    buildTrayMenu()
    buildAppMenu()
    registerProfileShortcuts()
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
