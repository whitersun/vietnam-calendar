<script setup lang="ts">
import { CalendarDays, Globe2 } from '@lucide/vue'

const { t, locale, locales, setLocale } = useI18n()
const changingLanguage = ref(false)

async function changeLanguage(value: unknown) {
  if (typeof value !== 'string' || !locales.value.some(item => item.code === value)) return
  changingLanguage.value = true
  try {
    await setLocale(value as 'vi' | 'en' | 'zh-TW' | 'zh-CN')
  }
  finally {
    changingLanguage.value = false
  }
}
</script>

<template>
  <a href="#main" class="sr-only z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">{{ t('nav.skip') }}</a>
  <header class="border-b bg-card/70 print:hidden">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-5 sm:gap-3 sm:px-8">
      <NuxtLinkLocale to="/" class="flex min-w-0 items-center gap-2 rounded-md sm:gap-3" :aria-label="t('brand.name')">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-10"><CalendarDays class="size-5" aria-hidden="true" /></span>
        <span class="min-w-0">
          <span class="block truncate text-base font-semibold tracking-tight sm:text-lg">{{ t('brand.name') }}</span>
          <span class="hidden text-xs text-muted-foreground sm:block">{{ t('brand.tagline') }}</span>
        </span>
      </NuxtLinkLocale>
      <div class="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <UiSelect :model-value="locale" :disabled="changingLanguage" @update:model-value="changeLanguage">
          <UiSelectTrigger class="h-10 w-auto gap-1.5 border-none bg-transparent px-2 shadow-none sm:min-w-32 sm:gap-2 sm:px-3" :aria-label="t('nav.language')">
            <Globe2 class="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
            <UiSelectValue />
          </UiSelectTrigger>
          <UiSelectContent align="end">
            <UiSelectItem v-for="language in locales" :key="language.code" :value="language.code">
              <span :lang="language.language">{{ language.name }}</span>
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>
  </header>
</template>
