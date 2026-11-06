---
name: wpp-mask-development
description: Develop WPP Mask with TypeScript, SCSS, pnpm, TDD, Make, Biome, Jest, and Lefthook, and prepare local extension releases.
---

# WPP Mask development

Read `AGENTS.md`, `docs/architecture.md`, and `docs/development.md`. Inspect the working tree and preserve unrelated edits. Use English filenames, source code, comments, documentation, and commit subjects.

## Terminal workflow

1. Discover commands with `make help`; check tools with `make doctor`.
2. Install dependencies and hooks with `make install`.
3. Use `make dev` to watch sources and load `dist/extension` in Chrome.
4. Follow red/green/refactor before implementing behavior changes.
5. Run `make check` and `make test` before completion.
6. Run `make package` when distributed assets change.
7. Use `make deploy` for validated local release preparation; store submission remains manual.

Use pnpm for direct package operations. Update Make targets, package scripts, documentation, and this skill together when commands change.

## Implementation boundaries

- TypeScript and SCSS are source; generated JS/CSS belong in `dist`.
- Sanitize storage through `src/settings.ts`. Avoid `any` and unchecked DOM access.
- Keep DOM selectors isolated; do not use private WhatsApp application state or modify React-owned text.
- Preserve immediate masking of new/recycled messages and history scrolling.
- Keep aliases plain text and settings local. Do not add permissions, networking, or message persistence incidentally.

Use Conventional Commits and let Lefthook validate them. Do not bypass hooks. GitHub publication does not authorize store publication. Finish with delivered behavior, executed checks, artifacts, and remaining live-application validation.
