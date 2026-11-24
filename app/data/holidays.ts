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
type SolarEvent = Omit<CalendarEvent, 'date'> & { monthDay: string; since?: number }

export const HOLIDAY_SOURCE = 'https://vanban.chinhphu.vn/?pageid=27160&docid=198540'
const UPSTREAM_SOURCE = 'https://github.com/commenthol/date-holidays/blob/master/data/countries/VN.yaml'
const VIETNAM_ANNIVERSARY_SOURCE = 'https://vanban.chinhphu.vn/default.aspx?docid=170518&pageid=27160'
const VIETNAM_TRADITIONS_SOURCE = 'https://baotanglichsu.vn/VI/Articles/3096/68456/tet-viet.html'
const TRADITIONAL_FESTIVALS_SOURCE = 'https://ngheandost.gov.vn/tap-chi-chuyen-san/chuyen-san-khxh-nv/chuyen-san-khxh-nv-so-2-2021-71.html?download=1&id=1'
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
const solarEvents: SolarEvent[] = [
    { id: 'partyFounding', monthDay: '02-03', kind: 'observance', source: VIETNAM_ANNIVERSARY_SOURCE },
    { id: 'physiciansDay', monthDay: '02-27', kind: 'observance', source: 'https://vnpa.moh.gov.vn/chuc-mung-ngay-thay-thuoc-viet-nam-27-02/' },
    { id: 'womensDay', monthDay: '03-08', kind: 'observance' },
    { id: 'hoChiMinhBirthday', monthDay: '05-19', kind: 'observance', source: VIETNAM_ANNIVERSARY_SOURCE },
    { id: 'childrensDay', monthDay: '06-01', kind: 'observance', source: 'https://tuoitre.daklak.gov.vn/tai-lieu-sinh-hoat-chi-doan/tai-lieu-sinh-hoat-chi-doan-thang-6-2020-2735.html' },
    { id: 'revolutionaryPressDay', monthDay: '06-21', kind: 'observance', source: 'https://tuoitre.daklak.gov.vn/tai-lieu-sinh-hoat-chi-doan/tai-lieu-sinh-hoat-chi-doan-thang-6-2020-2735.html' },
    { id: 'familyDay', monthDay: '06-28', kind: 'observance', since: 2001, source: 'https://vanban.chinhphu.vn/default.aspx?docid=8912&pageid=27160' },
    { id: 'remembranceDay', monthDay: '07-27', kind: 'observance', source: 'https://baochinhphu.vn/luon-ghi-nho-tri-an-va-song-xung-dang-voi-nhung-nguoi-da-khuat-da-hy-sinh-vi-to-quoc-vi-nhan-dan-102240723111017936.htm' },
    { id: 'augustRevolution', monthDay: '08-19', kind: 'observance', source: VIETNAM_ANNIVERSARY_SOURCE },
    { id: 'vietnameseWomensDay', monthDay: '10-20', kind: 'observance' },
    { id: 'vietnamLawDay', monthDay: '11-09', kind: 'observance', since: 2013, source: 'https://baochinhphu.vn/de-cao-song-va-lam-viec-theo-hien-phap-102152389.htm' },
    { id: 'nationalUnityDay', monthDay: '11-18', kind: 'observance', source: 'https://m.mattran.org.vn/van-ban-huong-dan/ngay-1811-duoc-lay-lam-ngay-ky-niem-thanh-lap-mat-tran-dan-toc-thong-nhat-viet-nam-tu-khi-nao-10575.html' },
    { id: 'teachersDay', monthDay: '11-20', kind: 'observance' },
    { id: 'vietnamHeritageDay', monthDay: '11-23', kind: 'observance', since: 2005, source: 'https://luutru.gov.vn/cong-bo-gioi-thieu-tai-lieu/sac-lenh-so-65-sl-ngay-23-11-1945-tien-de-ngay-di-san-van-hoa-viet-nam.htm' },
    { id: 'vietnamRedCrossAnniversary', monthDay: '11-23', kind: 'observance', source: 'https://www.redcross.org.vn/gioi-thieu/lich-su' },
    { id: 'peoplesArmyDay', monthDay: '12-22', kind: 'observance', source: 'https://www.mod.gov.vn/vn/chi-tiet/sa-ttsk/sa-tt-qpan/quan-doi-nhan-dan-viet-nam-niem-tu-hao-dan-toc' },
    { id: 'christmas', monthDay: '12-25', kind: 'observance' },
]
const lunarEvents: LunarEvent[] = [
    { id: 'firstFullMoon', month: 1, day: 15, kind: 'traditional' },
    { id: 'coldFoodFestival', month: 3, day: 3, kind: 'traditional', source: VIETNAM_TRADITIONS_SOURCE },
    { id: 'buddhaBirthday', month: 4, day: 15, kind: 'traditional', source: 'https://btgcp.gov.vn/pages/detail/1/Doi-net-ve-dao-Phat-va-Giao-hoi-Phat-giao-Viet-Nam.html' },
    { id: 'doanNgo', month: 5, day: 5, kind: 'traditional' },
    { id: 'vuLan', month: 7, day: 15, kind: 'traditional' },
    { id: 'midAutumn', month: 8, day: 15, kind: 'traditional' },
    { id: 'doubleNinth', month: 9, day: 9, kind: 'traditional', source: TRADITIONAL_FESTIVALS_SOURCE },
    { id: 'doubleTenth', month: 10, day: 10, kind: 'traditional', source: 'https://dukhach.quangbinh.gov.vn/web/dukhach/chi-tiet-tin/-/view-article/1/13978710067347/1131383291450567' },
    { id: 'haNguyen', month: 10, day: 15, kind: 'traditional', source: VIETNAM_TRADITIONS_SOURCE },
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
    for (const { monthDay, since, ...event } of solarEvents) {
        if (since === undefined || year >= since) events.push({ ...event, date: `${year}-${monthDay}` })
    }
    const nationwide = new Set(events.filter(event => event.kind === 'holiday').map(event => `${event.id}:${event.date}`))
    const calendarEvents = events.filter(event => {
        const hasHolidayVersion = event.kind === 'publicSectorDayOff' || event.kind === 'observance'
        return !hasHolidayVersion || !nationwide.has(`${event.id}:${event.date}`)
    })
    calendarEvents.sort((a, b) => a.date.localeCompare(b.date))
    eventCache.set(year, calendarEvents)
    return calendarEvents
}
