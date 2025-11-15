import { ElectronAPI } from '@electron-toolkit/preload'

interface EnvVariable {
  key: string
  value: string
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
  importSystemEnv: () => Promise<EnvProfile>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IEnvAPI
  }
}
