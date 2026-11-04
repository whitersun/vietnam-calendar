<script setup lang="ts">
import { ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Coffee, Link, Moon, Printer } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { formatDate, getLunarDate } from '~/utils/calendar'

const { t, locale } = useI18n()
const {
  today, selected, month, year, view, showLunar, monthTitle, eventsByDate, upcoming,
  selectDate, selectMonth, navigate, selectYear, previousDisabled, nextDisabled, years,
  goToday, setView, setLunar, openMonth,
} = useCalendar()
const isDesktop = useMediaQuery('(min-width: 1024px)')
const detailsOpen = ref(false)
const plannerOpen = ref(false)
const shareState = ref<'idle' | 'copied' | 'error'>('idle')
let shareTimeout: ReturnType<typeof setTimeout> | undefined
const selectedEvents = computed(() => eventsByDate.value.get(selected.value) || [])
const todayLunar = computed(() => getLunarDate(today.value))
const monthOptions = computed(() => Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1).padStart(2, '0'),
  label: formatDate(`${year.value}-${String(index + 1).padStart(2, '0')}-01`, locale.value, { month: 'long' }),
})))

useHead(() => ({ htmlAttrs: { lang: locale.value === 'vi' ? 'vi-VN' : locale.value } }))
useSeoMeta({
  title: () => `${t('brand.name')} — ${t('brand.tagline')}`,
  description: () => t('page.seoDescription'),
  ogTitle: () => `${t('brand.name')} — ${t('brand.tagline')}`,
  ogDescription: () => t('page.seoDescription'),
})

watch(isDesktop, value => { if (value) detailsOpen.value = false })
onBeforeUnmount(() => clearTimeout(shareTimeout))

async function chooseDate(date: string, openDetails = true, openMonth = false) {
  await selectDate(date, openMonth)
  if (openDetails && !isDesktop.value) detailsOpen.value = true
}

function chooseMonth(value: unknown) {
  if (typeof value === 'string') selectMonth(`${year.value}-${value}`)
}

function chooseYear(value: unknown) {
  if (typeof value === 'string') selectYear(value)
}

async function share() {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('date', selected.value)
    url.searchParams.set('month', month.value)
    await navigator.clipboard.writeText(url.toString())
    shareState.value = 'copied'
  }
  catch { shareState.value = 'error' }
  clearTimeout(shareTimeout)
  shareTimeout = setTimeout(() => { shareState.value = 'idle' }, 5000)
}

function print() { window.print() }

async function openPlanner() {
  plannerOpen.value = true
  await nextTick()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('leave-planner')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <div>
    <AppHeader />
    <main id="main" class="mx-auto max-w-7xl px-4 pb-8 sm:px-8">
      <section class="flex items-end justify-between gap-6 pt-9 pb-8 sm:pt-12 sm:pb-10 print:hidden">
        <div class="max-w-xl">
          <p class="mb-3 text-[10px] font-semibold tracking-[0.18em] text-primary/70 uppercase sm:text-xs">{{ t('page.eyebrow') }}</p>
          <h1 class="text-3xl leading-tight font-medium tracking-tight sm:text-[2.6rem]">{{ t('page.title') }}</h1>
          <p class="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{{ t('page.description') }}</p>
        </div>
        <button type="button" class="hidden min-w-48 rounded-xl border bg-card px-5 py-4 text-left transition-colors hover:bg-accent/40 md:block" @click="goToday">
          <span class="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><span class="size-1.5 rounded-full bg-primary" />{{ t('actions.today') }}</span>
          <span class="mt-2 block text-sm font-semibold">{{ formatDate(today, locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
          <span class="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Moon class="size-3" aria-hidden="true" />{{ todayLunar.day }}/{{ todayLunar.month }} · {{ t('calendar.lunar') }}</span>
        </button>
      </section>

      <div class="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <nav class="flex items-center gap-0.5 sm:gap-1" :aria-label="t('nav.calendar')">
          <span class="inline-flex h-10 items-center gap-2 rounded-lg bg-primary/7 px-2 text-xs font-medium text-primary sm:px-3 sm:text-sm"><CalendarDays class="hidden size-4 sm:block" aria-hidden="true" />{{ t('nav.calendar') }}</span>
          <UiButton type="button" variant="ghost" class="h-10 px-2 text-xs text-muted-foreground has-[>svg]:px-2 sm:px-3 sm:text-sm sm:has-[>svg]:px-3" :aria-expanded="plannerOpen" aria-controls="leave-planner" @click="openPlanner"><Coffee class="hidden size-4 sm:block" aria-hidden="true" />{{ t('nav.planner') }}</UiButton>
        </nav>
        <div class="flex items-center gap-1">
          <UiButton type="button" variant="ghost" size="sm" :aria-label="shareState === 'copied' ? t('actions.copied') : t('actions.share')" @click="share"><Check v-if="shareState === 'copied'" class="size-4 text-primary" aria-hidden="true" /><Link v-else class="size-4" aria-hidden="true" /><span class="hidden sm:inline">{{ shareState === 'copied' ? t('actions.copied') : t('actions.share') }}</span></UiButton>
          <UiButton type="button" variant="ghost" size="sm" :aria-label="t('actions.print')" @click="print"><Printer class="size-4" aria-hidden="true" /><span class="hidden sm:inline">{{ t('actions.print') }}</span></UiButton>
        </div>
      </div>
      <p v-if="shareState === 'error'" class="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive print:hidden" role="status">{{ t('actions.shareError') }}</p>
      <span class="sr-only" role="status">{{ shareState === 'copied' ? t('actions.copied') : '' }}</span>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_292px] print:block">
        <section class="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-xs print:border-[#ddd] print:shadow-none">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-5 sm:px-6">
            <div>
              <h2 class="text-xl font-semibold tracking-tight capitalize" aria-live="polite">{{ view === 'month' ? monthTitle : year }}</h2>
              <p class="mt-1 text-[11px] text-muted-foreground">{{ view === 'month' ? t('calendar.hint') : t('calendar.yearCaption') }}</p>
            </div>
            <div class="flex items-center gap-1 rounded-lg bg-muted p-1 print:hidden" role="group" :aria-label="t('nav.calendar')">
              <UiButton v-for="mode in ['month', 'year']" :key="mode" type="button" variant="ghost" size="sm" class="h-8 px-4 text-xs" :class="view === mode ? 'bg-card text-primary shadow-xs hover:bg-card dark:hover:bg-card' : 'text-muted-foreground'" :aria-pressed="view === mode" @click="setView(mode)">{{ t(mode === 'month' ? 'calendar.monthView' : 'calendar.yearView') }}</UiButton>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-3 sm:px-5 print:hidden">
            <div class="flex items-center gap-1.5">
              <UiButton type="button" variant="outline" size="icon" class="size-9 bg-card shadow-none" :disabled="previousDisabled" :aria-label="t('actions.previous')" @click="navigate(-1)"><ChevronLeft class="size-4" aria-hidden="true" /></UiButton>
              <UiButton type="button" variant="outline" size="sm" class="h-9 bg-card shadow-none" @click="goToday">{{ t('actions.today') }}</UiButton>
              <UiButton type="button" variant="outline" size="icon" class="size-9 bg-card shadow-none" :disabled="nextDisabled" :aria-label="t('actions.next')" @click="navigate(1)"><ChevronRight class="size-4" aria-hidden="true" /></UiButton>
            </div>
            <div class="flex items-center gap-2">
              <UiSelect v-if="view === 'month'" :model-value="month.slice(5)" @update:model-value="chooseMonth"><UiSelectTrigger :aria-label="t('actions.selectMonth')" class="capitalize shadow-none"><UiSelectValue /></UiSelectTrigger><UiSelectContent><UiSelectItem v-for="item in monthOptions" :key="item.value" :value="item.value" class="capitalize">{{ item.label }}</UiSelectItem></UiSelectContent></UiSelect>
              <UiSelect :model-value="String(year)" @update:model-value="chooseYear"><UiSelectTrigger :aria-label="t('actions.selectYear')" class="shadow-none"><UiSelectValue /></UiSelectTrigger><UiSelectContent><UiSelectItem v-for="item in years" :key="item" :value="String(item)">{{ item }}</UiSelectItem></UiSelectContent></UiSelect>
            </div>
          </div>

          <CalendarMonthGrid v-if="view === 'month'" :month="month" :selected="selected" :today="today" :show-lunar="showLunar" :events="eventsByDate" @select="chooseDate" />
          <div v-else class="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-4 print:gap-3">
            <CalendarMonthGrid v-for="item in monthOptions" :key="`${year}-${item.value}`" compact :show-lunar="false" :month="`${year}-${item.value}`" :selected="selected" :today="today" :events="eventsByDate" @select="(date, openDetails) => chooseDate(date, openDetails, openDetails)" @open-month="openMonth" />
          </div>

          <div class="flex flex-wrap items-center justify-between gap-4 border-t bg-card px-4 py-4 sm:px-6">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-muted-foreground sm:text-[11px]">
              <span class="flex items-center gap-1.5"><span class="size-1.5 rounded-full bg-destructive" />{{ t('calendar.holiday') }}</span>
              <span class="flex items-center gap-1.5"><span class="size-1.5 rounded-full bg-amber-500" />{{ t('calendar.traditional') }} / {{ t('calendar.observance') }}</span>
              <span class="flex items-center gap-1.5"><span class="size-1.5 rounded-full bg-primary" />{{ t('calendar.todayLabel') }}</span>
            </div>
            <div v-if="view === 'month'" class="flex items-center gap-2 print:hidden"><label for="show-lunar" class="text-[11px] text-muted-foreground">{{ t('calendar.showLunar') }}</label><UiSwitch id="show-lunar" :model-value="showLunar" @update:model-value="setLunar" /></div>
          </div>
        </section>

        <aside class="space-y-6 print:hidden">
          <section class="hidden rounded-2xl border bg-card p-5 lg:block"><CalendarDayDetails :selected="selected" :today="today" :events="selectedEvents" /></section>
          <CalendarUpcomingEvents :events="upcoming" @select="date => chooseDate(date)" />
          <button type="button" class="group flex w-full items-center justify-between gap-3 rounded-xl border border-primary/10 bg-secondary/60 p-4 text-left transition-colors hover:bg-secondary" @click="openPlanner"><span class="flex items-center gap-3"><Coffee class="size-4 shrink-0 text-primary" aria-hidden="true" /><span class="text-xs leading-5 font-medium text-primary">{{ t('planner.open') }}</span></span><ArrowUpRight class="size-4 shrink-0 text-primary" aria-hidden="true" /></button>
        </aside>
      </div>

      <div class="mt-7 flex flex-wrap items-start justify-between gap-3 text-[11px] leading-6 text-muted-foreground">
        <p class="max-w-2xl">{{ t('footer.note') }}</p>
        <p class="shrink-0">{{ t('calendar.timezone') }}</p>
      </div>
      <div v-show="plannerOpen" class="mt-7"><CalendarLeavePlanner :initial-date="selected" @close="plannerOpen = false" /></div>
      <footer class="mt-9 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-[10px] leading-6 text-muted-foreground print:hidden"><p>{{ t('footer.privacy') }}</p><p>{{ t('calendar.range') }}</p></footer>
    </main>

    <UiSheet v-model:open="detailsOpen">
      <UiSheetContent side="bottom" class="max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-card p-6 pb-8" :close-label="t('actions.close')">
        <UiSheetTitle class="sr-only">{{ t('detail.title') }}</UiSheetTitle>
        <UiSheetDescription class="sr-only">{{ t('detail.lunarNote') }}</UiSheetDescription>
        <CalendarDayDetails :selected="selected" :today="today" :events="selectedEvents" />
      </UiSheetContent>
    </UiSheet>
  </div>
</template>
