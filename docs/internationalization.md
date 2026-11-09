# Internationalization

The user interface supports Brazilian Portuguese and English using Chrome-compatible locale catalogs. Native Chrome localization handles manifest metadata; the popup's typed renderer also supports an explicit saved language preference. No locale-related permissions or dependencies are added.

## Language selection

- English browser UI locales, including regional variants such as `en-US` and `en-GB`, use English.
- Portuguese locales use Brazilian Portuguese.
- Unsupported languages fall back to Brazilian Portuguese.

The manifest sets `default_locale` to `pt_BR`. With the `auto` setting, `src/i18n.ts` uses `chrome.i18n.getUILanguage()` and the rules above. The settings panel can override the popup language with `pt_BR` or `en`, persisted in `settings.language`. The popup document language becomes `pt-BR` or `en` accordingly. Manifest metadata continues to follow Chrome's native locale selection. Language selection does not use WhatsApp's interface language or translate saved names and aliases.

## Catalogs and rendering

- `_locales/pt_BR/messages.json`: default Brazilian Portuguese messages.
- `_locales/en/messages.json`: English messages with the same keys.
- `src/i18n.ts`: typed catalog lookup, saved preference selection, placeholder interpolation, and static DOM translation.
- `popup/popup.html`: Portuguese initial text with `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, and `data-i18n-aria-label` hooks.
- `popup/popup.ts`: translated status/error messages and dynamically created removal buttons.

Manifest name and description use `__MSG_...__` references. Both catalogs are copied to the unpacked build and included in the ZIP. English source identifiers, filenames, and development documentation remain separate from translated product copy.

Translate text through `textContent` and attributes, never `innerHTML`. Use Chrome named placeholders with substitution values for dynamic text, such as a user's alias in an accessible button label. Never translate or rewrite user-provided group names or aliases.

## Adding or changing copy

1. Add the same message key to both catalogs, with translated values.
2. For static popup text, add a translation hook and retain Portuguese initial copy.
3. For dynamic text, call the typed `message` helper.
4. Add or update Jest/browser assertions, then run `make check`, `make test`, and `make package`.

Tests cover Portuguese variants, English variants, unsupported-language fallback, placeholders, accessible labels, status messages, catalog keys, build resources, and actual extension loading.

## Updating a local installation

Run `make build` and copy the **entire** `dist/extension` directory, including `_locales`. In `chrome://extensions`, reload Wpp Discreto, close and reopen its popup, and refresh WhatsApp Web. Switching the browser UI language may require restarting Chrome.
