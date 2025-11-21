import { ElectronAPI } from '@electron-toolkit/preload'

interface EnvVariable {
  key: string
  value: string
  scope?: 'system' | 'user' | 'process'
}

interface EnvProfile {
  id: string
  name: string
  description?: string
  variables: EnvVariable[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

type ExportFormat = 'json' | 'env'

interface IEnvAPI {
  loadProfiles: () => Promise<EnvProfile[]>
  saveProfiles: (profiles: EnvProfile[]) => Promise<boolean>
  applyProfile: (profile: EnvProfile) => Promise<boolean>
  importFromFile: (format: ExportFormat) => Promise<{ profiles?: EnvProfile[], variables?: EnvVariable[] } | null>
  exportToFile: (profile: EnvProfile, format: ExportFormat) => Promise<boolean>
  showSaveDialog: (defaultPath: string) => Promise<string | null>
  showOpenDialog: (filters: any[]) => Promise<string | null>
  getSystemEnv: () => Promise<EnvVariable[]>
  getWindowsEnv: () => Promise<{ system: EnvVariable[], user: EnvVariable[], process: EnvVariable[] }>
  setWindowsEnv: (key: string, value: string, scope: 'system' | 'user') => Promise<boolean>
  deleteWindowsEnv: (key: string, scope: 'system' | 'user') => Promise<boolean>
  setWindowsEnvBatch: (variables: EnvVariable[], scope: 'system' | 'user') => Promise<{ success: number, failed: number }>
  importSystemEnv: () => Promise<EnvProfile>
  getEnvFilePath: () => Promise<string>
  applyProfileToFile: (filePath: string, profile: EnvProfile) => Promise<boolean>
  updateTrayState: (state: { activeProfile: { id: string; name: string } | null; recentProfiles: { id: string; name: string }[] }) => Promise<void>
  getEnvConfigFiles: () => Promise<{ name: string; path: string; description: string }[]>
  readEnvConfigFile: (filePath: string) => Promise<string | null>
  writeEnvConfigFile: (filePath: string, content: string) => Promise<boolean>
  parseEnvFromConfig: (content: string) => Promise<EnvVariable[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IEnvAPI
  }
}
