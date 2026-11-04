<script setup lang="ts">
import { ArrowUpRight, Moon, Sun } from '@lucide/vue'
import type { CalendarEvent } from '~/data/holidays'
import { dayDistance, formatDate, getLunarDate } from '~/utils/calendar'

const props = defineProps<{ selected: string; today: string; events: CalendarEvent[] }>()
const { t, locale } = useI18n()
const lunar = computed(() => getLunarDate(props.selected))
const distance = computed(() => dayDistance(props.today, props.selected))
const relative = computed(() => distance.value === 0 ? t('detail.today') : t(distance.value > 0 ? 'detail.future' : 'detail.past', { count: Math.abs(distance.value) }))
</script>

<template>
    <div>
        <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-medium text-muted-foreground">{{ t('detail.title') }}</p>
            <span class="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-primary">{{ relative }}</span>
        </div>
        <div class="mt-5 flex items-end gap-4">
            <span class="text-7xl leading-none font-light tracking-tighter tabular-nums">{{ Number(selected.slice(8))
                }}</span>
            <div class="pb-1">
                <p class="font-medium capitalize">{{ formatDate(selected, locale, { weekday: 'long' }) }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{
                    formatDate(selected, locale, {
                        month: 'long', year:
                        'numeric'
                    })
                }}</p>
            </div>
        </div>
        <div class="mt-6 rounded-xl bg-background p-4">
            <p class="flex items-center gap-2 text-xs text-muted-foreground">
                <Moon class="size-3.5" aria-hidden="true" />{{ t('calendar.lunar') }}
            </p>
            <p class="mt-2 text-sm font-medium">{{
                t('detail.lunarDate', {
                    day: lunar.day, month: lunar.month, year:
                    lunar.year
                })
            }}</p>
            <p v-if="lunar.leap" class="mt-1 text-xs text-primary">{{ t('detail.leap') }}</p>
            <p v-if="lunar.day === 1 || lunar.day === 15" class="mt-1 text-xs text-primary">{{
                t(lunar.day === 1 ? 'detail.newMoon' : 'detail.fullMoon')
            }}</p>
        </div>
        <div class="mt-6 border-t pt-5">
            <h3 class="text-xs font-medium text-muted-foreground">{{ t('detail.events') }}</h3>
            <div v-if="events.length" class="mt-3 space-y-4">
                <article v-for="event in events" :key="event.id">
                    <p class="flex items-center gap-2 text-sm font-semibold"><span
                            class="size-1.5 shrink-0 rounded-full"
                            :class="event.kind === 'holiday' ? 'bg-destructive' : 'bg-amber-500'" />{{
                                t(`holidays.${event.id}.name`) }}</p>
                    <p class="mt-2 text-xs leading-6 text-muted-foreground">{{ t(`holidays.${event.id}.description`) }}
                    </p>
                    <a v-if="event.source" :href="event.source" target="_blank" rel="noopener noreferrer"
                        class="mt-2 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline">{{
                            t('detail.source')
                        }}
                        <ArrowUpRight class="size-3" aria-hidden="true" />
                    </a>
                </article>
            </div>
            <div v-else class="mt-4 flex items-start gap-3 text-muted-foreground">
                <Sun class="mt-0.5 size-4 shrink-0 text-amber-600/70" aria-hidden="true" />
                <p class="text-xs leading-6">{{ t('detail.noEvents') }}</p>
            </div>
        </div>
        <p class="mt-6 text-[11px] leading-5 text-muted-foreground">{{ t('detail.lunarNote') }}</p>
    </div>
</template>
