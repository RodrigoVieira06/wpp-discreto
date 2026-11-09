# Testing and TDD

For behavior changes, add a failing test, confirm the intended failure, implement the correction, and refactor while green. Keep regression tests.

```sh
make test
pnpm exec jest --runInBand tests/settings.test.ts
make check
```

Run `make build` before invoking browser tests directly. `make test` builds first. Jest uses SWC for transformation; run TypeScript checking separately.

## Coverage

| File | Checks |
| --- | --- |
| `settings.test.ts` | Stored input, Unicode names, duplicates, and manifest resources |
| `browser.test.ts` | Headless Chrome scenarios with simulated markup and mock storage |
| `browser-content.ts` | Scrolling, arrival, nested blocks, aliases, and DOM recycling |
| `browser-media.ts` | Grouped messages, mixed albums, loading, repeated scrolling, per-type blur, migration, and captions |
| `browser-screen.ts` | Physical boundaries, history, minimum readable area, full blur, resizing, and navigation |
| `browser-surfaces.ts` | First background thumbnails, info-card aliases, carousels, galleries/viewers, audio, preferences, and switch recovery |
| `screen-render.test.ts` | Pixel comparisons across the screen boundary, fullscreen viewers, media panels, backgrounds, and audio UI |
| `browser-popup.ts` | Saved controls and aliases, safe text, and failed writes |
| `local-deploy.test.ts` | Launcher prerequisites, extension loading, popup initialization, and control/footer reachability at 160 px and 600 px viewport heights |
| `i18n.test.ts` | Locale mapping, Portuguese manifest default, catalog keys, and localized build assets |
| `tooling.test.ts` | Source languages, tooling, and product-name consistency |
| `terminal.test.ts` | Make help, release prerequisites, and Conventional Commit validation |

Popup scenarios check master/alias switches, language overrides, ten-name suggestions, original-name editing, missing-name warnings versus unavailable tabs, reset confirmation/cancellation, and alias retention. They also cover the footer, author credit, media choices, advanced shortcut, tooltip navigation, and percentage retention in full-blur mode. Locale variants cover Portuguese, English, fallback languages, dynamic errors, placeholders, and accessible labels.

The viewer pixel fixture uses a generic fullscreen shell where only the main image has a known marker. A sibling footer contains selected, regular, background, and video thumbnails. Assertions check independent type choices, lazy arrivals, and restoring allowed photos. Other pixel checks cover a tall photo across the screen boundary at maximum stacking index, selected media below it, and sharp audio controls in full/advanced modes.

Lifecycle regressions cover viewer open/close, hidden attributes, `aria-hidden`, visibility changes, fullscreen media dialogs, and standalone viewer images. The obsolete always-blur field stays absent from the popup/model. Nested alias titles and unread counters also have regression coverage.

## Browser execution

Fixtures and Chrome profiles are temporary. Tests do not sign into WhatsApp or use a personal profile. Set `CHROME_BIN` to choose another Chrome executable.

The harness uses headless Chrome with `--no-sandbox` for local fixtures. If the host blocks execution, report the restriction and obtain required execution permissions rather than skipping tests.

Loading the extension verifies installation and popup initialization. Small-viewport checks run in a tab; they do not test a native toolbar-popup window. Simulated DOM and pixel tests do not establish authenticated WhatsApp compatibility. Keep messages, credentials, and browser profiles out of committed fixtures.

## Manual validation

The user confirmed manual WhatsApp validation on 2026-11-08. Repeat relevant checks after integration changes:

- Sidebar and filtered lists, arrivals, chat switching, and refresh.
- Aliases in list/header/info cards, editing/removal, duplicate names, nested titles, and unread badges.
- Readable areas 20%, 25%, 40%, 75%, and 100%; full blur; short chats; groups; tall messages and albums crossing the boundary.
- Mixed photos/videos/stickers, late loading, repeated bottom scrolling, and each media choice. Allowed media stays under the upper mask; selected media stays blurred below it.
- Older history: messages become readable in the lower area while the upper area remains protected.
- Master/alias switches, language, name lookup, warnings, propagation between tabs, and persistence after reload. Try lookup in an unrelated tab, while signed out, and after an extension reload.
- Advanced shortcut, tooltip focus/navigation, readable audio, full-blur percentage retention, and the 20% minimum.
- Info cards, carousels, galleries, opened assets, and history thumbnails after loading or switching media.
- Cancel and confirm default restoration; verify alias retention and a readable footer.
