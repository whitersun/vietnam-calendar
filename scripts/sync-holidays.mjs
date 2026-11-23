import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const sourcePath = process.argv[2]
assert.ok(sourcePath, 'Pass the path to an installed date-holidays package.')
const require = createRequire(import.meta.url)
const Holidays = require(resolve(sourcePath))
const holidays = new Holidays('VN', { types: ['public'] })
const rules = new Map()
const dayMs = 86_400_000

// Include the adjacent years used for the leading and trailing dates in the grid.
for (let year = 1999; year <= 2100; year++) {
  const englishNames = new Map(holidays.getHolidays(year, 'en').map(event => [event.rule, event.name]))
  for (const event of holidays.getHolidays(year, 'vi')) {
    // This rule is an estimate. Confirmed Tết breaks come from the annual schedules.
    if (event.rule.startsWith('1 day before vietnamese 1-0-1 ')) continue
    const firstDate = event.date.slice(0, 10)
    const start = Date.parse(`${firstDate}T00:00:00Z`)
    const length = (event.end.getTime() - event.start.getTime()) / dayMs
    assert.match(firstDate, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(Number.isInteger(length) && length >= 1 && length <= 31, `Invalid holiday duration for ${event.rule}`)

    const nameEn = englishNames.get(event.rule)
    assert.ok(event.rule && event.name && nameEn, `Missing holiday names for ${event.rule}`)
    if (!rules.has(event.rule)) rules.set(event.rule, { rule: event.rule, nameVi: event.name, nameEn, dates: new Set() })
    const entry = rules.get(event.rule)
    for (let offset = 0; offset < length; offset++) {
      entry.dates.add(new Date(start + offset * dayMs).toISOString().slice(0, 10))
    }
  }
}

const requiredDates = [
  ['01-01', '2026-01-01'],
  ['vietnamese 1-0-1', '2026-02-17'],
  ['vietnamese 3-0-10', '2026-04-26'],
  ['04-30', '2026-04-30'],
  ['05-01', '2026-05-01'],
  ['09-02', '2026-09-02'],
  ['11-24 since 2026', '2026-11-24'],
]
for (const [rule, date] of requiredDates) {
  assert.ok(rules.get(rule)?.dates.has(date), `Holiday source no longer returns ${rule} on ${date}`)
}

const rows = [...rules.values()].sort((a, b) => a.rule.localeCompare(b.rule, 'en')).map(entry => ({
  ...entry,
  dates: [...entry.dates].sort(),
}))
await writeFile(new URL('../app/data/public-holidays.json', import.meta.url), `${JSON.stringify(rows, null, 2)}\n`)
console.log(`Synced ${rows.length} Vietnamese public holiday rules.`)
