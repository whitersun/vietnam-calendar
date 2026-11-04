# Translation workflow

The UI currently uses saved translations. No translation API, credentials, paid calls, or runtime translation endpoint has been configured.

## Locales

| Locale | Audience | File |
| --- | --- | --- |
| `vi` | Vietnamese, source language | `i18n/locales/vi.json` |
| `en` | English | `i18n/locales/en.json` |
| `zh-TW` | Traditional Chinese, Taiwan usage | `i18n/locales/zh-TW.json` |
| `zh-CN` | Simplified Chinese, mainland usage | `i18n/locales/zh-CN.json` |

These are independent dictionaries, not a script-conversion layer. Dates and lunar calculations always remain Vietnamese; locale only changes presentation.

## Updating copy now

1. Add or update Vietnamese keys.
2. Update the corresponding keys in the other three dictionaries.
3. Keep interpolation variables such as `{count}`, `{date}` and `{year}` unchanged.
4. Run `bun run check:locales`. It verifies key parity, interpolation variables and literal UI references.
5. Review each language in the browser, including longer English labels and both Chinese variants.

## Future AI translation

Once a provider and model are chosen, add an on-demand maintenance script or a protected editorial operation that:

- Only sends changed Vietnamese strings and a small glossary.
- Requests `en`, `zh-TW`, and `zh-CN` separately, with the audience explicitly specified.
- Preserves JSON keys, placeholders, proper names, dates and URLs.
- Validates the response before saving; retains existing translations on failure.
- Records source hashes and model/prompt version to identify stale translations.
- Allows human edits and protects approved translations from accidental overwrites.

API credentials belong in server-only environment variables. They must not be included in browser code, locale files, logs, or public runtime config.

Language switching reads the saved dictionaries. It must not trigger a paid translation request per visitor.
