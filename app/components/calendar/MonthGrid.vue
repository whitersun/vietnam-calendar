<script setup lang="ts">
import type { CalendarEvent } from '~/data/holidays'
import { addDays, formatDate, monthDays, validDate, weekdayLabels } from '~/utils/calendar'

const props = withDefaults(defineProps<{
  month: string
  selected: string
  today: string
  showLunar?: boolean
  compact?: boolean
  events: Map<string, CalendarEvent[]>
}>(), { showLunar: true, compact: false })
const emit = defineEmits<{ select: [date: string, openDetails: boolean]; openMonth: [month: string] }>()
const { t, locale } = useI18n()
const days = computed(() => monthDays(props.month).map(day => {
  const events = props.events.get(day.iso) || []
  return { ...day, events, dayOff: day.weekend || events.some(event => event.kind === 'holiday') }
}))
const weekdays = computed(() => weekdayLabels(locale.value))
const title = computed(() => formatDate(`${props.month}-01`, locale.value, { month: 'long' }))
const fallbackFocus = computed(() => props.selected.startsWith(props.month) ? props.selected : `${props.month}-01`)
const grid = ref<HTMLElement>()
const pendingFocus = ref<string>()

watch(() => props.selected, async (value) => {
  if (pendingFocus.value !== value) return
  await nextTick()
  grid.value?.querySelector<HTMLButtonElement>(`button[data-date="${value}"]`)?.focus()
  pendingFocus.value = undefined
})

function accessibleLabel(day: typeof days.value[number]) {
  const lunar = `${day.lunar.day}/${day.lunar.month}${day.lunar.leap ? ` (${t('detail.leap')})` : ''}`
  const label = t('calendar.dateLabel', {
    date: formatDate(day.iso, locale.value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    lunar,
    events: day.events.map(event => t(`holidays.${event.id}.name`)).join(', '),
  })
  return day.dayOff ? `${label}. ${t('calendar.dayOff')}` : label
}

function onKeydown(event: KeyboardEvent, date: string) {
  const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
  const offset = offsets[event.key]
  if (offset === undefined) return
  event.preventDefault()
  const next = addDays(date, offset)
  if (!validDate(next)) return
  pendingFocus.value = next
  emit('select', next, false)
}
</script>

<template>
  <section class="print:break-inside-avoid print:p-3" :class="compact ? 'rounded-xl border bg-card p-4 sm:p-5' : ''" :aria-label="title">
    <button v-if="compact" type="button" class="mb-4 text-sm font-semibold capitalize hover:text-primary hover:underline" :aria-label="t('calendar.openMonth', { month: title })" @click="emit('openMonth', month)">{{ title }}</button>
    <div class="grid grid-cols-7" :class="compact ? 'mb-2' : 'border-b bg-background/60'">
      <div v-for="(day, index) in weekdays" :key="index" class="text-center font-medium" :class="[compact ? 'py-1 text-[10px]' : 'py-3 text-xs', index >= 5 ? 'text-destructive/80' : 'text-muted-foreground']">{{ day }}</div>
    </div>
    <div ref="grid" class="grid grid-cols-7" :class="{ 'gap-y-1': compact }" role="group" :aria-label="t('calendar.keyboardHint')">
      <button
        v-for="day in days"
        :key="day.iso"
        type="button"
        :data-date="day.iso"
        :disabled="!validDate(day.iso)"
        :tabindex="day.iso === fallbackFocus ? 0 : -1"
        :aria-label="accessibleLabel(day)"
        :title="accessibleLabel(day)"
        :aria-current="day.iso === today ? 'date' : undefined"
        :aria-pressed="day.iso === selected"
        :class="[
          'group relative flex min-w-0 flex-col transition-colors focus-visible:z-10 focus-visible:-outline-offset-2',
          compact ? 'h-8 items-center justify-center rounded-md text-xs print:h-[5mm] print:text-[8pt]' : 'min-h-21 items-start gap-1 border-r border-b p-2 text-sm last:border-r-0 sm:min-h-27 sm:p-3 print:min-h-[15mm] [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0',
          !day.inMonth ? (compact ? 'invisible' : '[&>span]:opacity-60') : '',
          day.dayOff ? 'bg-calendar-off text-calendar-off-foreground hover:bg-calendar-off-hover'
            : day.events.length ? 'bg-calendar-occasion text-calendar-occasion-foreground hover:bg-calendar-occasion-hover'
              : !day.inMonth ? 'bg-background/70 text-muted-foreground hover:bg-accent/65'
                : 'text-foreground hover:bg-accent/65',
          day.iso === selected ? 'z-10 ring-2 ring-inset ring-primary' : '',
        ]"
        @click="emit('select', day.iso, true)"
        @keydown="onKeydown($event, day.iso)"
      >
        <span :class="['flex items-center justify-center rounded-full font-medium tabular-nums', compact ? 'size-6' : 'size-7 sm:size-8 sm:text-base', day.iso === today ? 'bg-primary text-primary-foreground' : '']">{{ day.day }}</span>
        <span v-if="showLunar && !compact" class="ml-1 text-[10px] tabular-nums sm:text-xs" :class="day.lunar.day === 1 || day.lunar.day === 15 ? 'font-semibold text-primary' : day.dayOff || day.events.length ? 'text-current' : 'text-muted-foreground'">
          {{ day.lunar.day === 1 ? `${day.lunar.day}/${day.lunar.month}` : day.lunar.day }}<span v-if="day.lunar.leap" class="ml-0.5">*</span>
        </span>
        <span v-if="day.events.length" :class="compact ? 'absolute bottom-0.5 flex' : 'mt-auto flex w-full items-center gap-1.5'">
          <span class="size-1.5 shrink-0 rounded-full" :class="day.events.some(event => event.kind === 'holiday') ? 'bg-destructive' : 'bg-calendar-occasion-foreground'" />
          <span v-if="!compact" class="hidden truncate text-[10px] leading-4 sm:block">{{ t(`holidays.${day.events[0]!.id}.name`) }}</span>
        </span>
      </button>
    </div>
  </section>
</template>
