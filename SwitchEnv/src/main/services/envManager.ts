import { app, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface EnvVariable {
  key: string
  value: string
}

export interface EnvProfile {
  id: string
  name: string
  description?: string
  variables: EnvVariable[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export class EnvManager {
  private configPath: string
  private envFilePath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.configPath = path.join(userDataPath, 'profiles.json')
    this.envFilePath = path.join(userDataPath, '.env')
    this.ensureConfigFile()
  }

  private ensureConfigFile(): void {
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify([]), 'utf-8')
    }
  }

  // 加载所有配置
  loadProfiles(): EnvProfile[] {
    try {
      const data = fs.readFileSync(this.configPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to load profiles:', error)
      return []
    }
  }

  // 保存所有配置
  saveProfiles(profiles: EnvProfile[]): boolean {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(profiles, null, 2), 'utf-8')
      return true
    } catch (error) {
      console.error('Failed to save profiles:', error)
      return false
    }
  }

  // 应用配置（将环境变量写入 .env 文件）
  applyProfile(profile: EnvProfile): boolean {
    try {
      const envContent = profile.variables
        .map(v => `${v.key}=${v.value}`)
        .join('\n')
      fs.writeFileSync(this.envFilePath, envContent, 'utf-8')
      
      // 同时更新进程环境变量
      profile.variables.forEach(v => {
        process.env[v.key] = v.value
      })
      
      return true
    } catch (error) {
      console.error('Failed to apply profile:', error)
      return false
    }
  }

  // 从 JSON 文件导入
  async importFromJson(filePath: string): Promise<EnvProfile[] | null> {
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      const profiles = JSON.parse(data)
      
      // 验证格式
      if (Array.isArray(profiles)) {
        return profiles.map(p => ({
          ...p,
          id: Date.now().toString() + Math.random(),
          isActive: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }))
      } else if (profiles.id && profiles.name) {
        // 单个配置
        return [{
          ...profiles,
          id: Date.now().toString(),
          isActive: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }]
      }
      
      return null
    } catch (error) {
      console.error('Failed to import from JSON:', error)
      return null
    }
  }

  // 从 .env 文件导入
  async importFromEnv(filePath: string): Promise<EnvVariable[] | null> {
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      const variables: EnvVariable[] = []
      
      data.split('\n').forEach(line => {
        line = line.trim()
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=')
          if (key) {
            variables.push({
              key: key.trim(),
              value: valueParts.join('=').trim()
            })
          }
        }
      })
      
      return variables
    } catch (error) {
      console.error('Failed to import from .env:', error)
      return null
    }
  }

  // 导出为 JSON
  async exportToJson(profile: EnvProfile, filePath: string): Promise<boolean> {
    try {
      fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf-8')
      return true
    } catch (error) {
      console.error('Failed to export to JSON:', error)
      return false
    }
  }

  // 导出为 .env
  async exportToEnv(profile: EnvProfile, filePath: string): Promise<boolean> {
    try {
      const envContent = profile.variables
        .map(v => `${v.key}=${v.value}`)
        .join('\n')
      fs.writeFileSync(filePath, envContent, 'utf-8')
      return true
    } catch (error) {
      console.error('Failed to export to .env:', error)
      return false
    }
  }

  // 显示保存对话框
  async showSaveDialog(defaultPath: string): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'Env Files', extensions: ['env'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    return result.canceled ? null : result.filePath || null
  }

  // 显示打开对话框
  async showOpenDialog(filters: any[]): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters
    })
    
    return result.canceled ? null : result.filePaths[0] || null
  }

  // 获取 .env 文件路径
  getEnvFilePath(): string {
    return this.envFilePath
  }

  // 获取系统环境变量
  getSystemEnvVariables(): EnvVariable[] {
    const variables: EnvVariable[] = []
    const env = process.env
    
    console.log('[EnvManager] 开始获取系统环境变量...')
    console.log('[EnvManager] process.env 包含', Object.keys(env).length, '个键')
    
    // 过滤并转换系统环境变量
    for (const [key, value] of Object.entries(env)) {
      if (value !== undefined) {
        variables.push({
          key,
          value
        })
      }
    }
    
    console.log('[EnvManager] 提取了', variables.length, '个有效环境变量')
    
    // 按变量名排序
    return variables.sort((a, b) => a.key.localeCompare(b.key))
  }

  // 导入系统环境变量到新配置
  importSystemEnvVariables(): EnvProfile {
    const systemVars = this.getSystemEnvVariables()
    
    const profile: EnvProfile = {
      id: 'system-' + Date.now().toString(),
      name: '系统环境变量',
      description: '从本机系统导入的环境变量',
      variables: systemVars,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    return profile
  }
}
