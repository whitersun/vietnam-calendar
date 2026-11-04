<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import type { CalendarEvent } from '~/data/holidays'
import { formatDate } from '~/utils/calendar'

defineProps<{ events: CalendarEvent[] }>()
const emit = defineEmits<{ select: [date: string] }>()
const { t, locale } = useI18n()
</script>

<template>
  <section>
    <div class="mb-4 flex items-center gap-2">
      <span class="h-4 w-1 rounded-full bg-amber-500/70" />
      <h2 class="text-sm font-semibold">{{ t('upcoming.title') }}</h2>
    </div>
    <p class="mb-3 text-xs text-muted-foreground">{{ t('upcoming.description') }}</p>
    <div class="divide-y rounded-xl border bg-card px-4">
      <button v-for="event in events" :key="`${event.date}-${event.id}`" type="button" class="group flex w-full items-center gap-3 rounded-sm py-4 text-left" @click="emit('select', event.date)">
        <span class="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-background tabular-nums">
          <span class="text-sm font-semibold">{{ Number(event.date.slice(8)) }}</span>
          <span class="text-[9px] text-muted-foreground">{{ formatDate(event.date, locale, { month: 'short' }) }}</span>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-xs leading-5 font-medium group-hover:text-primary">{{ t(`holidays.${event.id}.name`) }}</span>
          <span class="mt-0.5 block text-[10px] text-muted-foreground">{{ t(`calendar.${event.kind}`) }} · {{ event.date.slice(0, 4) }}</span>
        </span>
        <ArrowUpRight class="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
      </button>
      <p v-if="!events.length" class="py-5 text-xs leading-6 text-muted-foreground">{{ t('upcoming.empty') }}</p>
    </div>
  </section>
</template>
