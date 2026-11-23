# Lịch Việt

A local Nuxt 4 calendar with Vietnamese lunar dates and four independently maintained interface languages: Vietnamese, English, Traditional Chinese (Taiwan), and Simplified Chinese.

## Features

- Month and year views, month/year navigation, today shortcut and keyboard day selection.
- Vietnamese lunar dates for 2000–2099. Language switching does not change the lunar calendar.
- Day details in a desktop sidebar or an accessible bottom sheet on smaller screens.
- Selected occasions, holiday dates, upcoming events, shareable date links and print styles.
- A leave calculator with a five-day or six-day working week and explicit holiday exclusions.
- Tailwind CSS 4 and editable shadcn Vue components, with Reka UI handling select/sheet/switch interactions.
- Light, dark and system appearance modes. Nuxt Color Mode applies the saved preference before rendering and stores it locally under `lich-viet-color-mode`.

## Local development

Requires Node.js 24+ for the test scripts' native TypeScript support, and Bun.

```sh
bun install
bun run dev
```

`postinstall` runs `nuxt prepare` to generate Nuxt types; it does not run a production build.

## Checks (no production build)

```sh
bun run test
bun run check:locales
bun run check:source
bunx vue-tsc --noEmit -p .nuxt/tsconfig.app.json
```

The type check requires generated Nuxt types from installation or the dev server. `check:source` checks Vue scripts/templates, not complete application behavior. No build or deployment is required by these scripts.

## Structure

- `app/components/calendar/`: calendar grid, day details, upcoming occasions and leave calculator.
- `app/components/ui/`: shadcn Vue source components. Their imports use `@lucide/vue`, the successor to `lucide-vue-next`.
- `app/composables/useCalendar.ts`: date/view state stored in URL query parameters.
- `app/utils/calendar.ts`: date-only operations and `date-chinese`'s `CalendarVietnamese` adapter.
- `app/data/holidays.ts`: combines selected observances, public holidays, and confirmed public-sector schedules.
- `app/assets/css/main.css`: shared Tailwind theme, base/accessibility rules and page-level print settings. Component-specific print styling uses Tailwind utilities in the owning components.
- `i18n/locales/`: independently editable dictionaries, lazy-loaded by Nuxt i18n.
- `docs/translations.md`: saved translation workflow and future AI translation boundaries.

## Styling conventions

- Prefer Tailwind utilities, including `print:` variants, directly in the component that owns the markup.
- Keep the global stylesheet limited to theme, base styles, accessibility and document-level rules.
- Use SCSS sparingly. When necessary, keep `index.scss` alongside the component's `index.vue` and import it from `<script setup>`.
- Write custom class names in full, such as `.calendar-toolbar` and `.calendar-day`, so they can be searched directly.
- Do not use BEM, double underscores or Sass selector concatenation such as `&-day` and `&__day`.

## Calendar data

Lunar calculations use the MIT-licensed [date-chinese](https://github.com/commenthol/date-chinese) library's Vietnamese calendar, which applies UTC+7 for the supported modern years. Tests include leap months, Vietnamese new year boundaries and the Vietnam/China difference in 2030. These checks do not establish historical or astronomical accuracy for every date.

`app/data/public-holidays.json` contains Vietnamese public-holiday dates generated from [date-holidays](https://github.com/commenthol/date-holidays/blob/master/data/countries/VN.yaml). The app reads this snapshot locally. New holidays can use the source's Vietnamese and English names until translations are available. `app/data/public-holiday-notices.json` records nationwide holidays confirmed ahead of an upstream release, with their effective dates and sources. These records take precedence when the matching solar date arrives upstream.

`app/data/public-sector-schedules.json` contains dated adjustments from published notices, starting with the 2026 and 2027 schedules. The calendar labels these separately. The optional holiday exclusion in the leave calculator applies to nationwide holidays. Employer schedules and future annual adjustments vary.

The **Update Vietnam holidays** GitHub workflow runs daily and can also be dispatched manually. It opens or refreshes a data PR when the upstream holiday dates change. It also checks Government Gazette and Government News RSS feeds and opens an issue for each matching notice, including a link for review. Feed text can describe proposals or omit details, so confirm dates and who they apply to before updating the annual schedule JSON.

If the repository enables **Allow GitHub Actions to create and approve pull requests**, the workflow opens its own PR. Otherwise it reports the updated branch in an issue with a comparison link. GitHub Issues must be enabled to receive these alerts. Neither job runs the Nuxt build.

## Translation and privacy

All four dictionaries are included. There is no AI service connection, API key, paid translation call, account system or database. Locale changes load saved messages. Selected dates/months appear in shareable URL query parameters. Dates are computed locally by the application. Appearance preferences are stored in the browser's local storage. Printing uses the light palette even when dark mode is selected.

No production build or deployment has been run as part of initial implementation.
