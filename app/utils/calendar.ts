import { CalendarVietnamese } from 'date-chinese'

export const MIN_YEAR = 2000
export const MAX_YEAR = 2099
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'
const DAY_MS = 86_400_000

export interface LunarDate {
  day: number
  month: number
  year: number
  leap: boolean
}

export interface CalendarDay {
  iso: string
  day: number
  inMonth: boolean
  weekend: boolean
  lunar: LunarDate
}

// Reuse the engine's astronomical cache. All conversions use Vietnamese meridians.
const lunarEngine = new CalendarVietnamese()
const lunarCache = new Map<string, LunarDate>()

export function fromIso(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`)
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = fromIso(value)
  return !Number.isNaN(date.getTime()) && toIso(date) === value
    && date.getUTCFullYear() >= MIN_YEAR && date.getUTCFullYear() <= MAX_YEAR
}

export function validMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value) && validDate(`${value}-01`)
}

export function vietnamToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find(part => part.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function addDays(iso: string, amount: number): string {
  const date = fromIso(iso)
  date.setUTCDate(date.getUTCDate() + amount)
  return toIso(date)
}

export function dayDistance(from: string, to: string): number {
  return Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / DAY_MS)
}

export function moveMonth(month: string, offset: number): string {
  const date = fromIso(`${month}-01`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  return toIso(date).slice(0, 7)
}

export function dateInMonth(iso: string, month: string): string {
  const first = fromIso(`${month}-01`)
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return `${month}-${String(Math.min(fromIso(iso).getUTCDate(), last)).padStart(2, '0')}`
}

export function getLunarDate(iso: string): LunarDate {
  const cached = lunarCache.get(iso)
  if (cached) return cached
  const date = fromIso(iso)
  const result = lunarEngine.fromGregorian(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()).get()
  const lunar = {
    day: result[4]!, month: result[2]!, year: lunarEngine.yearFromEpochCycle(), leap: Boolean(result[3]),
  }
  if (lunarCache.size > 5000) lunarCache.clear()
  lunarCache.set(iso, lunar)
  return lunar
}

export function monthDays(month: string): CalendarDay[] {
  const first = `${month}-01`
  const offset = (fromIso(first).getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const iso = addDays(first, index - offset)
    const date = fromIso(iso)
    return {
      iso, day: date.getUTCDate(), inMonth: iso.startsWith(month),
      weekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
      lunar: getLunarDate(iso),
    }
  })
}

export function formatDate(iso: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : locale, {
    timeZone: 'UTC', ...options,
  }).format(fromIso(iso))
}

export function weekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, index) => formatDate(addDays('2024-01-01', index), locale, { weekday: 'short' }))
}
