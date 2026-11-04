import { addDays, dayDistance, fromIso, validDate } from './calendar.ts'

export interface LeaveEstimate {
  total: number
  weekends: number
  holidays: number
  leave: number
}

export function estimateLeave(
  start: string,
  end: string,
  weekend: 'sat-sun' | 'sun',
  excludedDates: ReadonlySet<string> = new Set(),
): LeaveEstimate | 'invalid' | 'limit' {
  if (!validDate(start) || !validDate(end) || end < start) return 'invalid'
  const total = dayDistance(start, end) + 1
  if (total > 366) return 'limit'
  let weekends = 0
  let holidays = 0
  for (let index = 0; index < total; index++) {
    const date = addDays(start, index)
    const day = fromIso(date).getUTCDay()
    if (day === 0 || (weekend === 'sat-sun' && day === 6)) weekends++
    else if (excludedDates.has(date)) holidays++
  }
  return { total, weekends, holidays, leave: total - weekends - holidays }
}
