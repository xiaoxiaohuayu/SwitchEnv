// 环境变量接口
export interface EnvVariable {
  key: string
  value: string
  required?: boolean  // 是否必填
  description?: string  // 变量描述
}

// 标签接口
export interface Tag {
  id: string
  name: string
  color: string  // 标签颜色
}

// 验证规则
export interface ValidationRule {
  pattern?: RegExp  // 正则表达式验证
  minLength?: number
  maxLength?: number
  allowEmpty?: boolean
  customValidator?: (value: string) => boolean
}

// 验证错误
export interface ValidationError {
  key: string
  message: string
  type: 'warning' | 'error'
}

// 环境配置接口
export interface EnvProfile {
  id: string
  name: string
  description?: string
  variables: EnvVariable[]
  isActive: boolean
  createdAt: number
  updatedAt: number
  tags?: string[]  // 标签 ID 数组
  group?: string  // 分组名称
}

// 快捷模板接口
export interface Template {
  name: string
  description: string
  variables: EnvVariable[]
}

// 导入导出格式类型
export type ExportFormat = 'json' | 'env'

// IPC 通信接口
export interface IEnvAPI {
  // 配置管理
  loadProfiles: () => Promise<EnvProfile[]>
  saveProfiles: (profiles: EnvProfile[]) => Promise<boolean>
  
  // 环境变量操作
  applyProfile: (profile: EnvProfile) => Promise<boolean>
  
  // 文件操作
  importFromFile: (format: ExportFormat) => Promise<{ profiles?: EnvProfile[], variables?: EnvVariable[] } | null>
  exportToFile: (profile: EnvProfile, format: ExportFormat) => Promise<boolean>
  
  // 系统操作
  showSaveDialog: (defaultPath: string) => Promise<string | null>
  showOpenDialog: (filters: any[]) => Promise<string | null>
  
  // 系统环境变量
  getSystemEnv: () => Promise<EnvVariable[]>
  importSystemEnv: () => Promise<EnvProfile>
}
