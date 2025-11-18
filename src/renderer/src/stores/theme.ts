import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'env-theme-mode'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>('system')
  const systemPrefersDark = ref(false)
  let mediaQuery: MediaQueryList | null = null

  const effectiveTheme = computed<'light' | 'dark'>(() => {
    if (theme.value === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return theme.value
  })

  const applyTheme = () => {
    const isDark = effectiveTheme.value === 'dark'
    const root = document.documentElement
    root.classList.toggle('theme-dark', isDark)
    root.classList.toggle('theme-light', !isDark)
    root.classList.toggle('dark', isDark) // Element Plus dark theme hook
  }

  const setTheme = (mode: ThemeMode) => {
    theme.value = mode
    localStorage.setItem(THEME_STORAGE_KEY, mode)
    applyTheme()
  }

  const toggleTheme = () => {
    const next = effectiveTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const init = () => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    if (stored) {
      theme.value = stored
    }
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemPrefersDark.value = mediaQuery.matches
      mediaQuery.addEventListener('change', (event) => {
        systemPrefersDark.value = event.matches
        if (theme.value === 'system') {
          applyTheme()
        }
      })
    }
    applyTheme()
  }

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    init
  }
})
