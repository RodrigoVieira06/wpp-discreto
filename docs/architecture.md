# Architecture

## Runtime

Chrome Manifest V3 restricts execution to WhatsApp Web and declares only the `storage` API permission. There is no service worker or backend.

`src/settings.ts` exports typed defaults, validation, Unicode normalization, and alias cleanup. Both entry points import this module; esbuild bundles it without exposing a global API to WhatsApp.

`src/content.ts` observes DOM mutations and reacts to `chrome.storage.onChanged`. It applies prefixed attributes to decorate titles and reveal recent messages. The observer is disconnected while applying its own mutations to prevent loops.

`popup/popup.ts` reads and saves preferences, manages alias entries, restores controls after failed writes, and updates controls when another context changes storage.

The UI uses Chrome-compatible catalogs with `_locales/pt_BR` as default and `_locales/en` for English. `src/i18n.ts` supports automatic browser language or a saved override. Native Chrome localization handles metadata. Build and package scripts include both catalogs. See [internationalization](internationalization.md).

Master and aliases switches gate effects without deleting saved data. `src/chats.ts` isolates conversation-title extraction and loaded-name validation. The popup requests that context through the active tab's content-script message listener without additional permissions. See [popup controls](popup-controls.md).

## Presentation and data

SCSS compiles to static CSS. Message elements are masked before explicit reveal exceptions. Scroll handling revokes exceptions immediately; mutation callbacks revoke exceptions for recycled content before deferred rendering. Aliases use pseudo-elements without replacing React-owned text.

`chrome.storage.local` holds a `settings` object and an `aliases` array. `Settings` and `Alias` interfaces and all sanitization live in `src/settings.ts`. Stored values are untrusted input. Message contents are never persisted.

## Build

`scripts/build.ts` bundles TypeScript, compiles SCSS, and copies the manifest, popup HTML, and icons to `dist/extension`. Browser scenarios compile separately into `dist/test-runtime`.

`scripts/package.ts` uses an explicit resource list to create a ZIP without tests, docs, source TypeScript, dependencies, or browser profiles. `scripts/dev.ts` watches sources and serializes rebuilds.

`scripts/deploy-local.ts` launches an isolated Chrome profile and loads the actual build over a local DevTools pipe using `scripts/lib/cdp.ts`. The profile stays under the Git-ignored `.local` directory. Smoke tests use temporary profiles and open only the extension popup, not WhatsApp.

## Integration boundary

DOM selectors live in `src/content.ts`, `src/chats.ts`, and `src/content.scss`. WhatsApp updates can invalidate them. The fixture contains simulated markup and mock storage, not an authenticated session. Exact-name aliases do not provide stable group identification. Missing loaded names and unavailable tabs are separate validation states.
