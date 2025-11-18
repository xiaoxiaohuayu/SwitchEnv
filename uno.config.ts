import { defineConfig, presetUno, presetIcons } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2
    })
  ],
  transformers: [transformerDirectives()],
  theme: {
    colors: {
      primary: '#6a7ffb',
      secondary: '#8ec5fc',
      accent: '#f87171',
      success: '#34d399'
    }
  },
  shortcuts: {
    'card-base': 'rounded-xl border border-[var(--app-border-color)] bg-[var(--app-card-bg)] shadow-sm',
    'grid-dash': 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
  }
})
