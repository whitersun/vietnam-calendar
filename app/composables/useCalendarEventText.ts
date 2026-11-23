import type { CalendarEvent } from '~/data/holidays'

export function useCalendarEventText() {
  const { t, locale } = useI18n()

  function eventName(event: CalendarEvent) {
    return event.names?.[locale.value === 'vi' ? 'vi' : 'en'] ?? t(`holidays.${event.id}.name`)
  }

  function eventLabel(event: CalendarEvent) {
    const name = eventName(event)
    if (event.kind === 'publicSectorDayOff' || event.kind === 'publicSectorWorkday') {
      return `${name} · ${t(`calendar.${event.kind}`)}`
    }
    return name
  }

  return { eventName, eventLabel }
}
