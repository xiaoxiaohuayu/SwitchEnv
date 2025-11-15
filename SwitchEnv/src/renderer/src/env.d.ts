/// <reference types="vite/client" />

import type { IEnvAPI } from './types'

declare global {
  interface Window {
    api: IEnvAPI
  }
}
