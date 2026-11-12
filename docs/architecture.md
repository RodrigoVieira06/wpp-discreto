# Architecture

## Runtime

The Manifest V3 extension runs on `https://web.whatsapp.com/*` with the `storage` permission. It has no service worker or backend.

| Module | Responsibility |
| --- | --- |
| `src/settings.ts` | Settings types, defaults, validation, Unicode normalization, and alias cleanup |
| `src/content.ts` | DOM observation, preferences, title decoration, and viewport updates |
| `src/screen.ts` | Upper-viewport backdrop mask and audio exclusions |
| `src/messages.ts` | Media classification and asset annotation |
| `src/surfaces.ts` | Info-panel, viewer, and audio selectors |
| `src/chats.ts` | Passive sidebar discovery, visual ordering, and alias validation |
| `src/i18n.ts` | Typed locale lookup and saved language selection |
| `popup/popup.ts` | Controls, aliases, settings persistence, and write-error recovery |

`src/content.ts` disconnects its observer while applying its own DOM changes to prevent update loops. Storage changes refresh both content-script preferences and popup controls.

The popup requests conversation names through active-tab messaging to the existing content script. This requires no additional permission. All lookups use loaded and previously discovered names without moving the sidebar. Names appear in their observed visual order; array updates preserve known relative order without mutating WhatsApp nodes. Names not rendered by WhatsApp cannot be discovered without user navigation. The popup exposes a pending state with a spinner, localized loading label, and `aria-busy`. Master and alias switches pause effects without deleting saved data. See [popup controls](popup-controls.md).

## Rendering

SCSS compiles to static CSS. The screen mask blurs the upper conversation viewport and leaves a configurable lower area readable during history scrolling. Its SVG mask excludes audio controls; media cannot create holes in it. The readable area ranges from 20–100%, with a separate full-blur switch.

Media blur is opt-in and independent of conversation blur. The `data-wppd-enabled` attribute gates media effects with the master switch; `data-wppd-chat` controls the viewport mask separately. CSS protects new assets before classification and keeps selected media types blurred throughout conversations and media panels. Classification covers image, video, canvas, and CSS background assets. The observer updates classification and viewport/audio geometry before painting.

Viewer discovery includes the positioned fullscreen shell around a marked image, covering sibling history thumbnails without extending to the conversation list. A visible supported viewer suspends the chat overlay while individual media filters remain active. Outgoing media editors suspend that overlay and exempt their own preview assets; media outside the editor retains its filters. Composer detection is isolated in `src/surfaces.ts` and never relies on the send icon alone. Closing or hiding it restores the overlay. Media-type choices replace the obsolete always-blur setting. See [media protection](message-protection.md).

Aliases use pseudo-elements and `data-wppd-` attributes to preserve React-owned text. CSS clips nested original spans so their font sizes cannot expose the original beside the alias. Title extraction excludes unread indicators. Info-card decoration matches the active conversation name and excludes member lists and descriptions.

## Storage and language

`chrome.storage.local` stores a `settings` object and an `aliases` array. Validate stored input through `src/settings.ts`; the extension does not persist message contents.

Chrome locale catalogs use `_locales/pt_BR` as the default and `_locales/en` for English. Chrome localizes manifest metadata; the popup also supports a saved language override. The build and ZIP include both catalogs. See [internationalization](internationalization.md).

## Build and launcher

`scripts/build.ts` bundles TypeScript, compiles SCSS, and copies the manifest, popup HTML, and assets to `dist/extension`. It compiles browser test scenarios into `dist/test-runtime`.

`scripts/package.ts` creates a ZIP from an explicit resource list. It excludes tests, documentation, source TypeScript, dependencies, and browser profiles.

`scripts/deploy-local.ts` loads the build through `scripts/lib/cdp.ts` in an isolated Chrome profile at `.local/chrome-profile`. Smoke tests use temporary profiles, load the extension, and open its popup without signing into WhatsApp.

WhatsApp selectors live in the integration modules above and `src/content.scss`. WhatsApp updates can invalidate them. Fixtures use simulated markup and mock storage; test results do not establish authenticated WhatsApp compatibility.
