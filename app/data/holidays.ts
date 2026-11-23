import { addDays, getLunarDate } from '../utils/calendar.ts'
import publicHolidayNotices from './public-holiday-notices.json' with { type: 'json' }
import publicHolidays from './public-holidays.json' with { type: 'json' }
import publicSectorSchedules from './public-sector-schedules.json' with { type: 'json' }

export type HolidayKind = 'holiday' | 'traditional' | 'observance' | 'publicSectorDayOff' | 'publicSectorWorkday'
export interface CalendarEvent {
    id: string
    date: string
    kind: HolidayKind
    source?: string
    names?: { vi: string; en: string }
}

interface PublicSectorSchedule {
    id: string
    source: string
    daysOff: string[]
    workdays: string[]
    names?: CalendarEvent['names']
}

type LunarEvent = Omit<CalendarEvent, 'date'> & { month: number; day: number }

export const HOLIDAY_SOURCE = 'https://vanban.chinhphu.vn/?pageid=27160&docid=198540'
const UPSTREAM_SOURCE = 'https://github.com/commenthol/date-holidays/blob/master/data/countries/VN.yaml'
// Upstream rules supply the dates. These IDs retain the existing translated labels.
const publicHolidayLabels: Record<string, { id: string; source?: string }> = {
    '01-01': { id: 'newYear' },
    '04-30': { id: 'reunification' },
    '05-01': { id: 'labour' },
    '09-02': { id: 'nationalDay' },
    '11-24 since 2026': { id: 'vietnamCultureDay', source: 'https://vanban.chinhphu.vn/?docid=218008&pageid=27160' },
    'vietnamese 1-0-1': { id: 'tet' },
    'vietnamese 3-0-10': { id: 'hungKings' },
}
const solarEvents: { id: string; monthDay: string; kind: HolidayKind }[] = [
    { id: 'womensDay', monthDay: '03-08', kind: 'observance' },
    { id: 'vietnameseWomensDay', monthDay: '10-20', kind: 'observance' },
    { id: 'teachersDay', monthDay: '11-20', kind: 'observance' },
    { id: 'christmas', monthDay: '12-25', kind: 'observance' },
]
const lunarEvents: LunarEvent[] = [
    { id: 'firstFullMoon', month: 1, day: 15, kind: 'traditional' },
    { id: 'doanNgo', month: 5, day: 5, kind: 'traditional' },
    { id: 'vuLan', month: 7, day: 15, kind: 'traditional' },
    { id: 'midAutumn', month: 8, day: 15, kind: 'traditional' },
    { id: 'kitchenGods', month: 12, day: 23, kind: 'traditional' },
]

const publishedEventsByYear = new Map<number, CalendarEvent[]>()
const publishedLunarEventsByYear = new Map<number, LunarEvent[]>()
const officialSolarDates = new Set(publicHolidayNotices.map(notice => notice.monthDay))

function addPublishedEvent(event: CalendarEvent) {
    const year = Number(event.date.slice(0, 4))
    const events = publishedEventsByYear.get(year) ?? []
    events.push(event)
    publishedEventsByYear.set(year, events)
}

for (const entry of publicHolidays) {
    const [solarDate] = entry.rule.split(' ', 1)
    if (solarDate && officialSolarDates.has(solarDate)) continue
    const label = publicHolidayLabels[entry.rule]
    const event: Omit<CalendarEvent, 'date'> = label
        ? { id: label.id, kind: 'holiday', source: label.source ?? HOLIDAY_SOURCE }
        : { id: entry.rule, kind: 'holiday', source: UPSTREAM_SOURCE, names: { vi: entry.nameVi, en: entry.nameEn } }
    // Use the grid's Vietnamese lunar calendar for rules tied to a lunar day.
    const lunarRule = /^vietnamese (\d+)-0-(\d+)(?: since \d{4})?$/.exec(entry.rule)
    for (const date of entry.dates) {
        if (lunarRule) {
            const year = Number(date.slice(0, 4))
            const events = publishedLunarEventsByYear.get(year) ?? []
            events.push({ ...event, month: Number(lunarRule[1]), day: Number(lunarRule[2]) })
            publishedLunarEventsByYear.set(year, events)
        } else {
            addPublishedEvent({ ...event, date })
        }
    }
}

const schedules: PublicSectorSchedule[] = publicSectorSchedules
for (const { id, source, daysOff, workdays, names } of schedules) {
    for (const date of daysOff) {
        addPublishedEvent({ id, date, kind: 'publicSectorDayOff', source, names })
    }
    for (const date of workdays) addPublishedEvent({ id, date, kind: 'publicSectorWorkday', source, names })
}

const eventCache = new Map<number, CalendarEvent[]>()

export function getYearEvents(year: number): CalendarEvent[] {
    const cached = eventCache.get(year)
    if (cached) return cached
    const events = [...(publishedEventsByYear.get(year) ?? [])]
    const lunarRules = [...lunarEvents, ...(publishedLunarEventsByYear.get(year) ?? [])]
    for (const { id, monthDay, effectiveFrom, source } of publicHolidayNotices) {
        const date = `${year}-${monthDay}`
        if (date >= effectiveFrom) events.push({ id, date, kind: 'holiday', source })
    }
    for (const { id, monthDay, kind } of solarEvents) events.push({ id, date: `${year}-${monthDay}`, kind })
    let date = `${year}-01-01`
    while (date.startsWith(`${year}-`)) {
        const lunar = getLunarDate(date)
        if (!lunar.leap) {
            for (const { month, day, ...event } of lunarRules) {
                if (lunar.month === month && lunar.day === day) {
                    events.push({ ...event, date })
                }
            }
        }
        date = addDays(date, 1)
    }
    const nationwide = new Set(events.filter(event => event.kind === 'holiday').map(event => `${event.id}:${event.date}`))
    const calendarEvents = events.filter(event => event.kind !== 'publicSectorDayOff' || !nationwide.has(`${event.id}:${event.date}`))
    calendarEvents.sort((a, b) => a.date.localeCompare(b.date))
    eventCache.set(year, calendarEvents)
    return calendarEvents
}
