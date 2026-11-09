# Internationalization

The interface supports Brazilian Portuguese and English through Chrome-compatible catalogs. Chrome localizes manifest metadata; the popup also supports a saved language preference. Language selection requires no added permission or dependency.

## Language selection

The manifest sets `default_locale` to `pt_BR`. With `settings.language: auto`, `src/i18n.ts` reads `chrome.i18n.getUILanguage()`:

- English locales, including `en-US` and `en-GB`, use English.
- Portuguese and unsupported locales use Brazilian Portuguese.

In settings, you can override the popup language with `pt_BR` or `en`. The popup document language becomes `pt-BR` or `en`. Manifest metadata continues to use Chrome's locale selection. WhatsApp's language does not affect this choice, and the extension leaves saved names and aliases unchanged.

## Catalogs and rendering

| File | Role |
| --- | --- |
| `_locales/pt_BR/messages.json` | Default Brazilian Portuguese copy |
| `_locales/en/messages.json` | English copy with matching keys |
| `src/i18n.ts` | Typed lookup, saved preference, placeholder interpolation, and DOM translation |
| `popup/popup.html` | Portuguese initial text with `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, and `data-i18n-aria-label` hooks |
| `popup/popup.ts` | Translated statuses, errors, and dynamic removal buttons |

Manifest names and descriptions use `__MSG_...__` references. The build and ZIP include both catalogs. Keep filenames, source identifiers, and development documentation in English.

Render translations through `textContent` and attributes, not `innerHTML`. Use Chrome named placeholders for substitutions, such as an alias in an accessible button label. Do not translate or rewrite user-provided names or aliases.

## Changing copy

1. Add matching keys and translated values to both catalogs.
2. For static text, add a translation hook and retain Portuguese initial copy.
3. For dynamic text, call the typed `message` helper.
4. Update Jest/browser assertions, then run `make check`, `make test`, and `make package`.

Tests cover locale variants and fallback, placeholders, accessible labels, statuses, catalog keys, build resources, and extension loading.

## Updating a local installation

Run `make build` and copy the entire `dist/extension` directory, including `_locales`. Reload Wpp Discreto in `chrome://extensions`, reopen its popup, and refresh WhatsApp Web. Changing Chrome's UI language may require a browser restart.
