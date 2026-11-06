# WPP Mask — AI contributor instructions

## Read first

Read the [documentation index](docs/README.md), [AI workflow](docs/ai-instructions.md), [architecture](docs/architecture.md), and [development guide](docs/development.md). Then load the relevant [project skill](docs/skills/README.md).

## Objective and required workflow

Build a public Chrome extension for WhatsApp Web with local group aliases, blurred sidebar previews, and conversation protection that leaves a configurable number of recent messages readable.

- Use **pnpm** exclusively. Keep `pnpm-lock.yaml`; do not create npm or Yarn lockfiles.
- Use **TypeScript**, **SCSS**, **Biome**, and **Jest**, with strict TypeScript checking.
- Use **TDD** for behavior changes: add a test, confirm the intended failure, implement the smallest correction, rerun, then refactor while green. Keep regression tests.
- Use the **Makefile** as the documented terminal entry point. Keep Make targets, package scripts, docs, and skills synchronized.
- Use English **Conventional Commits**, enforced by **Lefthook** and **commitlint**. Do not bypass hooks to hide failures.
- Keep filenames, source identifiers, comments, commit messages, and development documentation in **English**. Name the data-handling document `DATA_POLICY.md`.
- Preserve unrelated user changes and report the checks actually executed.
- Do not claim simulated DOM tests validate the authenticated WhatsApp application.
- Do not publish to the Chrome Web Store or transmit chat data without explicit authorization. The user has authorized creating the public GitHub repository and pushing this project to `main`.

## Architecture and invariants

- Manifest V3, restricted to `https://web.whatsapp.com/*`; only the `storage` API permission.
- `src/settings.ts` owns settings types, defaults, validation, and alias normalization.
- `src/content.ts` observes the DOM, decorates titles, handles preferences, and selects recent messages.
- `src/content.scss` masks new messages before explicit reveal exceptions.
- `popup/` contains TypeScript, SCSS, and HTML for controls and aliases.
- esbuild and Sass compile into `dist/extension`. Load that directory in Chrome, not the repository root.
- Store only preferences and alias mappings in `chrome.storage.local`. No message persistence, backend, synchronization, analytics, or extension-owned network calls.
- Do not modify React-owned text or structures. Use `data-wppm-` attributes and visual aliases. Treat aliases as plain text.
- Blur options default to off; visible count defaults to 4, ranging from 0–12; strength ranges from 4–16 px.
- History scrolling hides all messages; returning to the end reveals the last N loaded blocks. Hover must not reveal them.
- Blur is visual protection, not encryption or access control.

## Known limits

- Aliases match exact original names, not group IDs. Same-name conversations, including contacts, share aliases; group renames require updating entries.
- No automatic group detection. Only sidebar titles and the conversation header are decorated. Search, accessibility text, and group information retain original names.
- WhatsApp DOM selectors are unstable; isolate integration changes and manually validate before store distribution.
- Counts use loaded blocks and may group albums. Notifications, search, and media panels are outside the protection scope.

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

Tests use Jest with SWC and simulated markup in Chrome headless. Set `CHROME_BIN` if needed. Report execution restrictions and obtain host-required execution permissions instead of skipping tests.

## Regression history and validation

Timer scheduling replaced `requestAnimationFrame` after tests exposed deferred updates in headless execution. Timers can also be throttled; they are not a real-time guarantee. A confirmed red/green regression exposed recycled message contents before deferred rendering; the observer now revokes reveal exceptions in a microtask before painting.

Actual extension loading and popup initialization are covered by the local deployment smoke test in headless Chrome. Authenticated WhatsApp validation remains pending. The data policy still needs publisher identity and support contact before store publication. Automated Web Store submission is not configured; OAuth/API setup is documented in `docs/distribution.md`.
