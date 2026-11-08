---
name: wpp-mask-development
description: Develop WPP Mask with TypeScript, SCSS, pnpm, TDD, Make, Biome, Jest, and Lefthook, and prepare local extension releases.
---

# WPP Mask development

Read `AGENTS.md`, `docs/architecture.md`, and `docs/development.md`. Inspect the working tree and preserve unrelated edits. Use English filenames, source code, comments, documentation, and commit subjects.

## Terminal workflow

1. Discover commands with `make help`; check tools with `make doctor`.
2. Install dependencies and hooks with `make install`.
3. Use `make dev` to watch sources. Use `make deploy-local` to build and automatically load the extension in a separate persistent Chrome profile. Close that test session and rerun after changes.
4. Follow red/green/refactor before implementing behavior changes.
5. Run `make check` and `make test` before completion.
6. Run `make package` when distributed assets change.
7. Use `make deploy` for validated local release preparation; store submission remains manual.

Use pnpm for direct package operations. Update Make targets, package scripts, documentation, and this skill together when commands change.

Read `docs/local-deployment.md` for local browser requirements. Profiles at `.local/chrome-profile` contain test-session data; keep them ignored and excluded from packages. Local deployment must never modify the user's regular browser profile. Store API publishing is a separate future configuration step, not a side effect of `make deploy-local` or `make deploy`.

Confirm whether a terminal is local or connected over SSH before promising a visible browser. The browser appears on the execution host. For Windows, use the documented local PowerShell commands and a Windows Chrome executable path; do not treat the Linux smoke test as Windows validation.

## Implementation boundaries

- TypeScript and SCSS are source; generated JS/CSS belong in `dist`.
- Sanitize storage through `src/settings.ts`. Avoid `any` and unchecked DOM access.
- Keep DOM selectors isolated; do not use private WhatsApp application state or modify React-owned text.
- Keep screen protection in `src/screen.ts`: a readable lower percentage of the viewport, including during history scrolling. Do not reintroduce message-count reveal exceptions. Refresh viewport/audio geometry before painting. Never cut media holes in the screen mask: allowed media clears only below the boundary. Selected types remain blurred in full everywhere. Suspend the viewport overlay while a supported media viewer is open and restore it on close; do not reintroduce the obsolete always-blur setting. Bound the readable area to 20–100%; full text blur is a separate saved switch. Media defaults to opt-in; the advanced shortcut selects every media preference.
- Keep aliases plain text and settings local. Do not add permissions, networking, or message persistence incidentally.
- Preserve aliases and preferences when the master/alias switches are off. Restore defaults resets settings, not mappings. Keep lookup limited to loaded conversation names, cap suggestions at ten, and distinguish missing loaded names from unavailable WhatsApp tabs. Follow `docs/popup-controls.md`.
- Keep UI copy short and explanatory. Do not add slogans, promotional empty states, or persistent ready messages. The language setting can override automatic browser detection.
- Preserve intrinsic popup control heights, the 380 px width, normal document scrolling, and the plain-language footer about local-only effects and unchanged original data. Confirm before restoring settings. Use `src/messages.ts` and `src/surfaces.ts` for media, info-panel, and audio handling; cover first background tiles, carousels, galleries/viewers, and active info-card aliases; keep selectors aligned with SCSS and retain album, unread-counter, and nested-title regression tests.
- Keep the approved logo in `assets/logo.png`. Use `make icons` to resize it into the committed Chrome icons; do not redesign the artwork during routine builds. Follow `docs/branding.md` for asset paths and packaging.
- Keep user-facing copy in Chrome locale catalogs, with Brazilian Portuguese as default and English for English browser UI locales. Unsupported languages use Portuguese. Use the typed message helper for dynamic text and translate accessible labels and placeholders. Follow `docs/internationalization.md`; source identifiers and documentation stay in English.

Use Conventional Commits and let Lefthook validate them. Do not bypass hooks. GitHub publication does not authorize store publication. Finish with delivered behavior, executed checks, artifacts, and remaining live-application validation.
