# Wpp Discreto: AI contributor instructions

## Read first

Read the [documentation index](docs/README.md), [AI workflow](docs/ai-instructions.md), [architecture](docs/architecture.md), [development guide](docs/development.md), and relevant [project skill](docs/skills/README.md).

For interface changes, read [product context](PRODUCT.md), [visual rules](DESIGN.md), and the [popup surface brief](.impeccable/surfaces/popup.md).

## Objective and required workflow

Build a public Chrome extension for WhatsApp Web with local group aliases, blurred sidebar previews, and conversation protection that leaves a configurable lower screen area readable.

- Use **pnpm** exclusively. Keep `pnpm-lock.yaml`; do not create npm or Yarn lockfiles.
- Use **TypeScript**, **SCSS**, **Biome**, and **Jest**, with strict TypeScript checking.
- Use **TDD** for behavior changes: add a test, confirm the intended failure, implement the smallest correction, rerun, then refactor while green. Keep regression tests.
- Use the **Makefile** as the documented terminal entry point. Keep Make targets, package scripts, docs, and skills synchronized.
- Use English **Conventional Commits**, enforced by **Lefthook** and **commitlint**. Do not bypass hooks to hide failures.
- Keep filenames, source identifiers, comments, commit messages, and development documentation in **English**. Name the data-handling document `DATA_POLICY.md`.
- Product UI must use **Brazilian Portuguese by default**, English for English browser UI locales, and Portuguese for unsupported languages. Keep copy in `_locales/pt_BR/messages.json` and `_locales/en/messages.json`; use Chrome i18n and the typed `src/i18n.ts` helper. Translate statuses, placeholders, accessible labels, and manifest metadata too. Do not translate user-provided aliases. See `docs/internationalization.md`.
- The settings panel supports a saved `auto`/`pt_BR`/`en` language override. Keep product copy factual and necessary; no slogans, promotional phrasing, or constant ready messages.
- Preserve unrelated user changes and report the checks you ran.
- Do not claim simulated DOM tests validate the authenticated WhatsApp application.
- Do not publish to the Chrome Web Store or transmit chat data without explicit authorization. The user has authorized creating the public GitHub repository and pushing this project to `main`.

## Architecture and invariants

- Manifest V3, restricted to `https://web.whatsapp.com/*`; only the `storage` API permission.
- Use `src/settings.ts` for settings types, defaults, validation, and alias normalization.
- Master and aliases switches default to enabled and retain preferences/mappings when disabled. Restoring defaults resets settings only, never deletes aliases. For older settings, default missing switches to enabled and language to automatic.
- `src/chats.ts` reads up to ten unique loaded sidebar names for suggestions and validates requested original names against loaded titles. Use active-tab message passing without extra permissions. Never persist discovered names automatically; only user-saved mappings are stored.
- `src/content.ts` observes the DOM, decorates titles, handles preferences, and updates the conversation viewport mask.
- `src/screen.ts` masks the upper conversation viewport with a pointer-transparent backdrop overlay. `src/surfaces.ts` isolates info/media/audio selectors. `src/messages.ts` classifies media assets independently without creating media holes in the viewport mask. Do not restore per-message count exceptions.
- `src/content.scss` keeps initial content protected and masks selected media independently of the viewport overlay.
- `popup/` contains TypeScript, SCSS, and HTML for controls and aliases.
- Preserve the approved `assets/logo.png`: a sharp WhatsApp symbol with a larger sharp dark-green dialogue bubble at the lower right. Neither symbol has blur. `make icons` uses Sharp to regenerate the committed 16/32/48/128 px PNGs; the popup and Chrome toolbar use those icons. See `docs/branding.md`.
- esbuild and Sass compile into `dist/extension`. Load that directory in Chrome, not the repository root.
- Store only preferences and alias mappings in `chrome.storage.local`. No message persistence, backend, synchronization, analytics, or extension-owned network calls.
- Do not modify React-owned text or structures. Use `data-wppd-` attributes and visual aliases. Treat aliases as plain text.
- Blur options default to off; readable lower screen area defaults to 40%, ranging from 20–100%; a separate `fullBlur` switch defaults to false and protects the full text viewport without changing the percentage; strength ranges from 4–16 px.
- Media choices `blurImages`, `blurVideos`, and `blurStickers` default to false when missing. Preserve explicit saved choices. The advanced-blur shortcut enables chat protection and selects all three media types; switching it off clears media options while retaining text protection. Audio controls are always exempt from visual protection. Media preferences apply with chat protection enabled. Selected types always remain blurred in full, including in the readable area and viewers. Allowed media still blurs inside the protected screen area and clears only outside it. The obsolete `alwaysBlurMedia` preference is ignored and removed from the popup. Unidentified types must not inherit a type exemption. See `docs/message-protection.md`.
- Require confirmation before restoring defaults; cancel writes nothing. Retain the footer explaining local changes, unchanged WhatsApp data, and no transmission/storage of conversation contents.
- Sidebar title extraction must exclude unread counters. Alias CSS must visually hide nested original title children while retaining their DOM text; never concatenate original and alias.
- History scrolling keeps the same readable lower screen area, so older messages can be read by scrolling them into it. Large messages and albums may cross the boundary. Hover must not reveal protected pixels.
- Blur is visual protection, not encryption or access control.

## Known limits

- Aliases match exact original names, not group IDs. Same-name conversations, including contacts, share aliases; group renames require updating entries.
- No automatic group detection. Sidebar titles, the conversation header, and the active conversation name in supported info cards are decorated. Search, member lists, descriptions, and accessibility text retain original names.
- WhatsApp updates can break selectors. Isolate integration changes and check them manually before store distribution. Scope amber missing-name warnings and tooltips to loaded conversations. Unavailable tabs must not be treated as invalid aliases. See `docs/popup-controls.md`.
- Screen masking depends on conversation viewport detection. Notifications and search are outside the protection scope. Selected media in info-card carousels, galleries, and media viewers (including history thumbnails beside a marked main image) is protected independently of the chat screen boundary. A visible supported media viewer suspends the chat overlay while individual type filters remain active; closing/hiding it restores the overlay. Manually check context menus and floating UI within the masked area.

## Commands

```sh
make help
make install
make deploy-local
make check
make test
make package
```

`make deploy` prepares a validated package for **manual** store submission. It does not upload or publish. GitHub pushes and store publication are separate operations.

`make deploy-local` builds and opens Chrome with the actual extension loaded through a DevTools pipe. Its persistent test profile is `.local/chrome-profile`, ignored by Git and preserved by `make clean`. Never use the ordinary personal Chrome profile. Close the test session before deploying locally again. See `docs/local-deployment.md`.

The launcher opens a browser on its execution host. SSH does not display that browser on the client PC. Confirm the target machine and OS before giving interactive launch instructions. PowerShell instructions for Windows are documented, but execution is verified only on Linux.

Run Jest with SWC and simulated markup in headless Chrome. Set `CHROME_BIN` if needed. Report execution restrictions and obtain host-required execution permissions instead of skipping tests.

## Regression history and validation

Tests exposed deferred headless updates with `requestAnimationFrame`, so scheduling uses timers. Chrome can throttle timers too; do not treat them as a real-time guarantee. The previous count-based implementation revoked recycled-message exceptions before painting. Screen protection now avoids message reveal exceptions entirely and refreshes viewport/audio geometry and media classification in the mutation-observer microtask.

A regression covers master-switch recovery after an initial storage-read failure: a later settings change supersedes that failure and can disable every effect.

Popup controls must retain intrinsic height and the existing 380 px width, with normal document scrolling and the footer in document flow. Never constrain controls with `100vh` or a fixed footer. Short-viewport regression checks cover this layout. Screenshot comparisons cover actual screen-mask pixels on synthetic markup.

The headless smoke test loads the extension and initializes its popup. The user confirmed manual WhatsApp validation on 2026-11-08. Automated tests did not observe that authenticated session. The data policy identifies Rodrigo Lima as publisher and rodrigovlima06@gmail.com as support contact; its public URL is documented in `docs/distribution.md`. Automated Web Store submission is not configured; OAuth/API setup is documented in `docs/distribution.md`.
