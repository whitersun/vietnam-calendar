import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CalendarChinese } from 'date-chinese'
import { addDays, dateInMonth, dayDistance, formatDate, getLunarDate, monthDays, moveMonth, validDate, validMonth, vietnamToday } from '../app/utils/calendar.ts'
import { getYearEvents } from '../app/data/holidays.ts'
import { estimateLeave } from '../app/utils/planner.ts'

test('Vietnamese midnight is independent of the host timezone', () => {
  assert.equal(vietnamToday(new Date('2026-11-04T16:59:59Z')), '2026-11-04')
  assert.equal(vietnamToday(new Date('2026-11-04T17:00:00Z')), '2026-11-05')
})

test('reject impossible dates, query arrays and dates outside the supported range', () => {
  for (const value of ['2026-02-29', '2026-13-01', '2026-04-31', '1999-12-31', '2100-01-01', ['2026-11-04'], null]) assert.equal(validDate(value), false)
  assert.equal(validDate('2024-02-29'), true)
  assert.equal(validDate('2099-12-31'), true)
  assert.equal(validMonth('2026-00'), false)
  assert.equal(validMonth('2026-11'), true)
})

test('month navigation clamps days and crosses years correctly', () => {
  assert.equal(moveMonth('2026-12', 1), '2027-01')
  assert.equal(moveMonth('2026-01', -1), '2025-12')
  assert.equal(dateInMonth('2026-01-31', '2026-02'), '2026-02-28')
  assert.equal(dateInMonth('2024-01-31', '2024-02'), '2024-02-29')
})

test('month grid starts on Monday and includes every day once', () => {
  const days = monthDays('2026-11')
  assert.equal(days.length, 42)
  assert.equal(days[0].iso, '2026-10-26')
  assert.equal(days.filter(day => day.inMonth).length, 30)
  assert.equal(new Set(days.map(day => day.iso)).size, 42)
  assert.equal(days[5].weekend, true)
  assert.equal(days[6].weekend, true)
})

test('Tết reference dates and lunar year boundaries', () => {
  for (const [year, date] of [[2023, '2023-01-22'], [2024, '2024-02-10'], [2025, '2025-01-29'], [2026, '2026-02-17'], [2030, '2030-02-02']]) {
    assert.deepEqual(getLunarDate(date), { day: 1, month: 1, year, leap: false })
    assert.equal(getLunarDate(addDays(date, -1)).year, year - 1)
  }
})

test('Vietnamese 2030 new year differs from the Chinese calendar', () => {
  const chinese = new CalendarChinese().fromGregorian(2030, 2, 2).get()
  assert.equal(getLunarDate('2030-02-02').day, 1)
  assert.notEqual(chinese[4], 1)
})

test('recognizes leap months without repeating traditional festivals', () => {
  assert.deepEqual(getLunarDate('2023-03-22'), { day: 1, month: 2, year: 2023, leap: true })
  assert.deepEqual(getLunarDate('2025-07-25'), { day: 1, month: 6, year: 2025, leap: true })
  assert.equal(getYearEvents(2025).filter(event => event.id === 'tet').length, 1)
})

test('holiday dates are distinct from annual substitute-day schedules', () => {
  const events = getYearEvents(2026)
  assert.equal(events.find(event => event.id === 'hungKings').date, '2026-04-26')
  assert.equal(events.find(event => event.id === 'midAutumn').date, '2026-09-25')
  assert.equal(events.find(event => event.id === 'teachersDay').kind, 'observance')
  assert.deepEqual(events.filter(event => event.date === '2026-04-27').map(event => event.kind), ['publicSectorDayOff'])
})

test('November occasions can share a date without marking a Vietnamese day off', () => {
  const events = getYearEvents(2026)
  const eventsOn = date => events.filter(event => event.date === date).map(event => [event.id, event.kind])

  assert.deepEqual(eventsOn('2026-11-03'), [['japanCultureDay', 'observance']])
  assert.deepEqual(eventsOn('2026-11-18'), [
    ['doubleTenth', 'traditional'],
    ['nationalUnityDay', 'observance'],
  ])
  assert.deepEqual(eventsOn('2026-11-23'), [
    ['haNguyen', 'traditional'],
    ['vietnamHeritageDay', 'observance'],
    ['vietnamRedCrossAnniversary', 'observance'],
    ['japanLaborThanksgiving', 'observance'],
  ])
  assert.deepEqual(getLunarDate('2026-11-23'), { day: 15, month: 10, year: 2026, leap: false })
})

test('Hạ Nguyên follows the lunar date while the Japanese observance stays on 23 November', () => {
  const events = getYearEvents(2027)
  const festival = events.find(event => event.id === 'haNguyen')
  assert.notEqual(festival.date, '2027-11-23')
  assert.deepEqual(getLunarDate(festival.date), { day: 15, month: 10, year: 2027, leap: false })
  assert.equal(events.find(event => event.id === 'japanLaborThanksgiving').date, '2027-11-23')
})

test('imported lunar holiday rules use the same Vietnamese lunar date as the grid', () => {
  const event = getYearEvents(2050).find(event => event.id === 'hungKings')
  assert.deepEqual(getLunarDate(event.date), { day: 10, month: 3, year: 2050, leap: false })
})

test('Vietnam Culture Day is a paid holiday starting in 2026', () => {
  const id = 'vietnamCultureDay'
  assert.ok(!getYearEvents(2025).some(event => event.id === id))
  for (const year of [2026, 2027]) {
    assert.deepEqual(getYearEvents(year).filter(event => event.id === id), [{
      id,
      date: `${year}-11-24`,
      kind: 'holiday',
      source: 'https://vanban.chinhphu.vn/?docid=218008&pageid=27160',
    }])
  }
})

test('the existing 27 July observance becomes a paid holiday in 2027', () => {
  for (const [year, kind] of [[2026, 'observance'], [2027, 'holiday']]) {
    const events = getYearEvents(year).filter(event => event.id === 'remembranceDay')
    assert.deepEqual(events.map(event => [event.date, event.kind]), [[`${year}-07-27`, kind]])
  }
})

test('confirmed public-sector schedules display days off and make-up workdays without changing general holidays', () => {
  const events2026 = getYearEvents(2026)
  assert.ok(events2026.some(event => event.date === '2026-08-31' && event.kind === 'publicSectorDayOff'))
  assert.ok(events2026.some(event => event.date === '2026-08-22' && event.kind === 'publicSectorWorkday'))

  const events2027 = getYearEvents(2027)
  assert.deepEqual(events2027.filter(event => event.date === '2027-09-02').map(event => event.kind), ['holiday'])
  assert.deepEqual(events2027.filter(event => event.date === '2027-09-03').map(event => event.kind), ['publicSectorDayOff'])
  assert.equal(events2027.filter(event => event.id === 'tet').length, 7)
  assert.equal(events2027.filter(event => event.id === 'tet' && event.kind === 'holiday').length, 1)
  assert.ok(!getYearEvents(2028).some(event => event.kind.startsWith('publicSector')))
})

test('changing display locale cannot change underlying solar/lunar dates', () => {
  const before = getLunarDate('2030-02-02')
  for (const locale of ['vi', 'en', 'zh-TW', 'zh-CN']) {
    assert.ok(formatDate('2030-02-02', locale, { dateStyle: 'full' }))
    assert.deepEqual(getLunarDate('2030-02-02'), before)
  }
})

test('date differences use whole civil days across year boundaries', () => {
  assert.equal(dayDistance('2026-12-31', '2027-01-01'), 1)
  assert.equal(dayDistance('2024-02-28', '2024-03-01'), 2)
})

test('leave estimate respects a five-day or six-day working week', () => {
  assert.deepEqual(estimateLeave('2026-11-02', '2026-11-08', 'sat-sun'), { total: 7, weekends: 2, holidays: 0, leave: 5 })
  assert.deepEqual(estimateLeave('2026-11-02', '2026-11-08', 'sun'), { total: 7, weekends: 1, holidays: 0, leave: 6 })
})

test('holiday exclusions are explicit and do not double count weekends', () => {
  assert.equal(estimateLeave('2026-04-30', '2026-05-03', 'sat-sun').leave, 2)
  assert.deepEqual(estimateLeave('2026-04-30', '2026-05-03', 'sat-sun', new Set(['2026-04-30', '2026-05-01', '2026-05-02'])), { total: 4, weekends: 2, holidays: 2, leave: 0 })
})

test('leave estimate validates and bounds user input', () => {
  assert.equal(estimateLeave('2026-11-08', '2026-11-02', 'sat-sun'), 'invalid')
  assert.equal(estimateLeave('', '2026-11-02', 'sat-sun'), 'invalid')
  assert.equal(estimateLeave('2026-01-01', '2027-01-02', 'sat-sun'), 'limit')
  assert.deepEqual(estimateLeave('2026-11-08', '2026-11-08', 'sat-sun'), { total: 1, weekends: 1, holidays: 0, leave: 0 })
})
