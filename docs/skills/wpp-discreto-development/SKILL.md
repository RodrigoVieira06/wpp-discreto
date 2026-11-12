---
name: wpp-discreto-development
description: Develop Wpp Discreto with TypeScript, SCSS, pnpm, TDD, Make, Biome, Jest, and Lefthook, and prepare local releases.
---

# Wpp Discreto development

Read `AGENTS.md`, `docs/architecture.md`, and `docs/development.md`. Check the working tree and preserve unrelated edits. Keep filenames, source code, comments, documentation, and commit subjects in English.

For interface work, read `PRODUCT.md`, `DESIGN.md`, and `.impeccable/surfaces/popup.md`. Preserve the approved visual identity and verify the built popup at its shipping width. Future landing/showcase pages require an approved reference image before implementation; popup refinements proceed in code.

## Terminal workflow

1. Use `make help` to find commands and `make doctor` to check tools.
2. Install dependencies and hooks with `make install`.
3. Use `make dev` to watch sources. For an isolated browser session, run `make deploy-local`; close it before relaunching after changes.
4. Follow red/green/refactor for behavior changes.
5. Run `make check` and `make test` before completion.
6. Run `make package` after changing distributed assets.
7. Use `make deploy` to prepare a validated ZIP for manual store submission.

Use `make store-assets` to regenerate the store icon and synthetic demonstration screenshots. See `store/README.md`; promotional artwork is supplied separately and preserved by the command. The bundle is separate from the extension package.

Use pnpm for direct package operations. Update Make targets, scripts, documentation, and this skill together if commands change.

Read `docs/local-deployment.md` before using the launcher. Keep `.local/chrome-profile` ignored and outside packages; leave the personal Chrome profile unchanged. Store API publishing requires separate configuration and authorization.

Before giving launch instructions, establish the target machine and OS. SSH starts Chrome on the remote host. Windows PowerShell instructions require a Windows executable; Linux smoke tests do not validate them.

## Implementation rules

- Write TypeScript and SCSS; put generated JavaScript/CSS in `dist`. Validate storage through `src/settings.ts`. Avoid `any` and unchecked DOM access.
- Isolate selectors. Do not use private WhatsApp state or modify React-owned text/structures. Render aliases as plain text and keep preferences local. Permission, network, or message-persistence changes need a requirement.
- Keep viewport protection in `src/screen.ts`. Use a readable lower area of 20–100%, including during history scrolling, plus a separate full-blur switch. Avoid message-count exceptions and media holes. Update viewport/audio geometry before painting; selected media remains blurred in full. Suspend the overlay in supported viewers and restore it on close. Outgoing media editors also suspend the overlay and exempt only their draft assets; restore ordinary protection after send/cancel and avoid exempting normal composers or received viewers. Keep the obsolete always-blur setting removed.
- Default media choices to off. Media choices work independently of conversation blur. The advanced shortcut selects all types without changing `blurChat`; the master switch disables both effects. Use `src/messages.ts` and `src/surfaces.ts` for assets, info panels, and audio. Cover first background tiles, sibling viewer history, carousels, galleries, and active info-card aliases; align SCSS selectors and retain album/unread/nested-title regressions.
- Keep preferences and mappings when master/alias switches turn off. Default restoration resets settings after confirmation and retains aliases. Cap suggestions at ten loaded names; distinguish missing loaded names from unavailable tabs. See `docs/popup-controls.md`.
- Preserve the popup's 380 px width, intrinsic control heights, normal scrolling, and footer. The footer explains local changes, unchanged WhatsApp data, and no transmission/storage of conversation contents. Use short explanatory copy without slogans, promotional empty states, or persistent ready messages.
- Keep the approved `assets/logo.png`. Resize it with `make icons`; builds must not redesign it. Preview artwork changes and obtain approval before applying or pushing them. See `docs/branding.md`.
- Keep UI copy in both Chrome catalogs. Use Brazilian Portuguese by default and for unsupported languages, English for English browser locales, and the saved language override when set. Use the typed helper for dynamic text; translate statuses, placeholders, accessible labels, and metadata. See `docs/internationalization.md`.

Use Conventional Commits and allow Lefthook to run. Do not bypass failing hooks. Report delivered behavior, executed checks, artifacts, and remaining integration limits. GitHub pushes and store publication require separate authorization.
