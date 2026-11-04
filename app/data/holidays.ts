import { addDays, getLunarDate } from '../utils/calendar.ts'

export type HolidayKind = 'holiday' | 'traditional' | 'observance'
export interface CalendarEvent {
    id: string
    date: string
    kind: HolidayKind
    source?: string
}

// Dates of occasions only. Annual leave schedules and compensatory days are NOT inferred.
export const HOLIDAY_SOURCE = 'https://vanban.chinhphu.vn/?pageid=27160&docid=198540'
const solarEvents: { id: string; monthDay: string; kind: HolidayKind }[] = [
    { id: 'newYear', monthDay: '01-01', kind: 'holiday' },
    { id: 'womensDay', monthDay: '03-08', kind: 'observance' },
    { id: 'reunification', monthDay: '04-30', kind: 'holiday' },
    { id: 'labour', monthDay: '05-01', kind: 'holiday' },
    { id: 'nationalDay', monthDay: '09-02', kind: 'holiday' },
    { id: 'vietnameseWomensDay', monthDay: '10-20', kind: 'observance' },
    { id: 'teachersDay', monthDay: '11-20', kind: 'observance' },
    { id: 'christmas', monthDay: '12-25', kind: 'observance' },
]
const lunarEvents: { id: string; month: number; day: number; kind: HolidayKind }[] = [
    { id: 'tet', month: 1, day: 1, kind: 'holiday' },
    { id: 'firstFullMoon', month: 1, day: 15, kind: 'traditional' },
    { id: 'hungKings', month: 3, day: 10, kind: 'holiday' },
    { id: 'doanNgo', month: 5, day: 5, kind: 'traditional' },
    { id: 'vuLan', month: 7, day: 15, kind: 'traditional' },
    { id: 'midAutumn', month: 8, day: 15, kind: 'traditional' },
    { id: 'kitchenGods', month: 12, day: 23, kind: 'traditional' },
]

const eventCache = new Map<number, CalendarEvent[]>()

export function getYearEvents(year: number): CalendarEvent[] {
    const cached = eventCache.get(year)
    if (cached) return cached
    const events: CalendarEvent[] = solarEvents.map(event => ({
        id: event.id, date: `${year}-${event.monthDay}`, kind: event.kind,
        ...(event.kind === 'holiday' ? { source: HOLIDAY_SOURCE } : {}),
    }))
    let date = `${year}-01-01`
    while (date.startsWith(`${year}-`)) {
        const lunar = getLunarDate(date)
        if (!lunar.leap) {
            for (const event of lunarEvents) {
                if (lunar.month === event.month && lunar.day === event.day) {
                    events.push({ id: event.id, date, kind: event.kind, ...(event.kind === 'holiday' ? { source: HOLIDAY_SOURCE } : {}) })
                }
            }
        }
        date = addDays(date, 1)
    }
    events.sort((a, b) => a.date.localeCompare(b.date))
    eventCache.set(year, events)
    return events
}
