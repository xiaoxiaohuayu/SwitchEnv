import { defineConfig, presetUno, presetIcons, presetTypography } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle'
      }
    }),
    presetTypography()
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#3b82f6',
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
      },
      secondary: {
        DEFAULT: '#64748b',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
      surface: {
        DEFAULT: '#ffffff',
        dark: '#1e293b',
        hover: '#f1f5f9',
        'dark-hover': '#334155'
      }
    }
  },
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'card-base': 'rounded-xl border border-[var(--app-border-color)] bg-[var(--app-card-bg)] shadow-sm transition-all duration-200',
    'card-hover': 'hover:shadow-md hover:border-[var(--color-primary-300)] dark:hover:border-[var(--color-primary-700)]',
    'btn-icon': 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer',
    'input-base': 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all',
    'glass': 'backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30'
  }
})
