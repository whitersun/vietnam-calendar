<script setup lang="ts">
import { ArrowRight, Coffee, Info, RotateCcw, X } from '@lucide/vue'
import { addDays, MAX_YEAR, MIN_YEAR, validDate } from '~/utils/calendar'
import { getYearEvents } from '~/data/holidays'
import { estimateLeave } from '~/utils/planner'

const props = defineProps<{ initialDate: string }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const start = ref(props.initialDate)
const end = ref(validDate(addDays(props.initialDate, 6)) ? addDays(props.initialDate, 6) : props.initialDate)
const weekend = ref<'sat-sun' | 'sun'>('sat-sun')
const excludeHolidays = ref(false)
const result = computed(() => {
  const excluded = new Set<string>()
  // Bound work before collecting holidays, including for malformed URL/input values.
  const initial = estimateLeave(start.value, end.value, weekend.value)
  if (typeof initial === 'string' || !excludeHolidays.value) return initial
  const startYear = Number(start.value.slice(0, 4))
  const endYear = Number(end.value.slice(0, 4))
  for (let year = startYear; year <= endYear; year++) {
    for (const event of getYearEvents(year)) {
      if (event.kind === 'holiday') excluded.add(event.date)
    }
  }
  return estimateLeave(start.value, end.value, weekend.value, excluded)
})

function reset() {
  start.value = props.initialDate
  end.value = validDate(addDays(props.initialDate, 6)) ? addDays(props.initialDate, 6) : props.initialDate
  weekend.value = 'sat-sun'
  excludeHolidays.value = false
}
</script>

<template>
  <section id="leave-planner" class="scroll-mt-6 rounded-2xl border bg-card p-5 sm:p-7 print:hidden" aria-labelledby="planner-heading">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Coffee class="size-5" aria-hidden="true" /></span>
        <div><h2 id="planner-heading" class="font-semibold">{{ t('planner.title') }}</h2><p class="mt-1 text-sm leading-6 text-muted-foreground">{{ t('planner.description') }}</p></div>
      </div>
      <UiButton type="button" variant="ghost" size="icon" :aria-label="t('planner.close')" @click="emit('close')"><X class="size-4" aria-hidden="true" /></UiButton>
    </div>
    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
          <div class="min-w-0"><label for="leave-start" class="mb-2 block text-xs font-medium">{{ t('planner.start') }}</label><input id="leave-start" v-model="start" type="date" :min="`${MIN_YEAR}-01-01`" :max="`${MAX_YEAR}-12-31`" class="h-11 w-full min-w-0 rounded-lg border bg-background px-2 text-sm sm:px-3" :aria-invalid="result === 'invalid'" aria-describedby="planner-message"></div>
          <ArrowRight class="mb-3 size-4 text-muted-foreground" aria-hidden="true" />
          <div class="min-w-0"><label for="leave-end" class="mb-2 block text-xs font-medium">{{ t('planner.end') }}</label><input id="leave-end" v-model="end" type="date" :min="start || `${MIN_YEAR}-01-01`" :max="`${MAX_YEAR}-12-31`" class="h-11 w-full min-w-0 rounded-lg border bg-background px-2 text-sm sm:px-3" :aria-invalid="result === 'invalid'" aria-describedby="planner-message"></div>
        </div>
        <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
          <label for="weekend-select" class="text-xs font-medium">{{ t('planner.weekend') }}</label>
          <UiSelect v-model="weekend"><UiSelectTrigger id="weekend-select" class="bg-background"><UiSelectValue /></UiSelectTrigger><UiSelectContent><UiSelectItem value="sat-sun">{{ t('planner.satSun') }}</UiSelectItem><UiSelectItem value="sun">{{ t('planner.sun') }}</UiSelectItem></UiSelectContent></UiSelect>
        </div>
        <div class="mt-4 flex items-center justify-between gap-4"><label for="exclude-holidays" class="text-xs font-medium">{{ t('planner.markHolidays') }}</label><UiSwitch id="exclude-holidays" v-model="excludeHolidays" /></div>
      </div>
      <div class="rounded-xl bg-secondary/65 p-5" aria-live="polite" aria-atomic="true">
        <p v-if="typeof result === 'string'" id="planner-message" class="text-sm leading-6 text-destructive">{{ t(`planner.${result}`) }}</p>
        <template v-else>
          <p id="planner-message" class="text-xs text-primary">{{ t('planner.leaveDays') }}</p>
          <p class="mt-3 text-5xl font-light tracking-tight text-primary tabular-nums">{{ result.leave }}</p>
          <dl class="mt-5 space-y-2 text-xs text-muted-foreground">
            <div class="flex justify-between gap-3"><dt>{{ t('planner.days') }}</dt><dd class="font-medium text-foreground">{{ result.total }}</dd></div>
            <div class="flex justify-between gap-3"><dt>{{ t('planner.weekendDays') }}</dt><dd class="font-medium text-foreground">{{ result.weekends }}</dd></div>
            <div v-if="excludeHolidays" class="flex justify-between gap-3"><dt>{{ t('planner.excluded') }}</dt><dd class="font-medium text-foreground">{{ result.holidays }}</dd></div>
          </dl>
        </template>
      </div>
    </div>
    <div class="mt-5 flex flex-wrap items-start justify-between gap-3 border-t pt-5">
      <p class="flex max-w-2xl items-start gap-2 text-xs leading-6 text-muted-foreground"><Info class="mt-1 size-3.5 shrink-0" aria-hidden="true" />{{ t('planner.note') }}</p>
      <UiButton type="button" variant="ghost" size="sm" @click="reset"><RotateCcw class="size-3.5" aria-hidden="true" />{{ t('actions.reset') }}</UiButton>
    </div>
  </section>
</template>
