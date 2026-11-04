import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', '@nuxtjs/color-mode', 'shadcn-nuxt'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-11-04',
  devtools: { enabled: false },
  vite: { plugins: [tailwindcss()] },
  shadcn: { prefix: 'Ui', componentDir: './app/components/ui' },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storage: 'localStorage',
    storageKey: 'lich-viet-color-mode',
    disableTransition: true,
  },
  i18n: {
    defaultLocale: 'vi',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: [
      { code: 'vi', language: 'vi-VN', name: 'Tiếng Việt', file: 'vi.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'zh-TW', language: 'zh-TW', name: '繁體中文', file: 'zh-TW.json' },
      { code: 'zh-CN', language: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
    ],
    vueI18n: './i18n.config.ts',
  },
  app: {
    head: {
      title: 'Lịch Việt',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
