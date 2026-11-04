import { MAX_YEAR, MIN_YEAR, addDays, dateInMonth, formatDate, moveMonth, validDate, validMonth, vietnamToday } from '~/utils/calendar'
import { getYearEvents } from '~/data/holidays'

export function useCalendar() {
  const route = useRoute()
  const router = useRouter()
  const { locale } = useI18n()
  const today = useState('vietnam-today', () => vietnamToday())
  const month = computed(() => validMonth(route.query.month)
    ? route.query.month
    : validDate(route.query.date) ? route.query.date.slice(0, 7) : today.value.slice(0, 7))
  const selected = computed(() => validDate(route.query.date) && route.query.date.startsWith(month.value)
    ? route.query.date
    : dateInMonth(today.value, month.value))
  const year = computed(() => Number(month.value.slice(0, 4)))
  const view = computed(() => route.query.view === 'year' ? 'year' : 'month')
  const showLunar = computed(() => route.query.lunar !== '0')
  const monthTitle = computed(() => formatDate(`${month.value}-01`, locale.value, { month: 'long', year: 'numeric' }))
  const yearEvents = computed(() => getYearEvents(year.value))
  const eventsByDate = computed(() => {
    const lookup = new Map<string, ReturnType<typeof getYearEvents>>()
    // Include adjacent years for the trailing/leading dates in the month grid.
    for (const event of [year.value - 1, year.value, year.value + 1].flatMap(getYearEvents)) {
      lookup.set(event.date, [...(lookup.get(event.date) || []), event])
    }
    return lookup
  })
  const upcoming = computed(() => [year.value, year.value + 1]
    .filter(value => value <= MAX_YEAR)
    .flatMap(getYearEvents)
    .filter(event => event.date >= `${month.value}-01`)
    .slice(0, 4))

  function update(values: Record<string, string | undefined>) {
    return router.replace({ query: { ...route.query, ...values } })
  }

  function selectDate(date: string, openMonth = false) {
    if (!validDate(date)) return
    return update({ date, month: date.slice(0, 7), ...(openMonth ? { view: undefined } : {}) })
  }

  function selectMonth(value: string) {
    if (!validMonth(value)) return
    return update({ month: value, date: dateInMonth(selected.value, value) })
  }

  function navigate(direction: number) {
    return selectMonth(moveMonth(month.value, direction * (view.value === 'year' ? 12 : 1)))
  }

  function moveSelection(direction: number) {
    return selectDate(addDays(selected.value, direction))
  }

  function selectYear(value: string) {
    return selectMonth(`${value}-${month.value.slice(5)}`)
  }

  const previousDisabled = computed(() => !validMonth(moveMonth(month.value, view.value === 'year' ? -12 : -1)))
  const nextDisabled = computed(() => !validMonth(moveMonth(month.value, view.value === 'year' ? 12 : 1)))
  const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => MIN_YEAR + index)

  return {
    today, selected, month, year, view, showLunar, monthTitle, yearEvents, eventsByDate, upcoming,
    selectDate, selectMonth, navigate, moveSelection, selectYear, previousDisabled, nextDisabled, years,
    goToday: () => selectDate(today.value),
    openMonth: (value: string) => validMonth(value) ? update({ month: value, date: dateInMonth(selected.value, value), view: undefined }) : undefined,
    setView: (value: string) => update({ view: value === 'year' ? 'year' : undefined }),
    setLunar: (value: boolean) => update({ lunar: value ? undefined : '0' }),
  }
}
