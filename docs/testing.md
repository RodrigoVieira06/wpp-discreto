# Testing and TDD

Write a failing test before a behavior change, verify the intended failure, implement the smallest correction, and refactor while green. Keep regression tests.

```sh
make test
pnpm exec jest --runInBand tests/settings.test.ts
make check
```

Build first with `make build` when invoking browser tests directly. Normal `make test` builds automatically.

## Layers

- `settings.test.ts`: persisted input, Unicode names, duplicates, and built manifest resources.
- `browser.test.ts`: Chrome headless integration with simulated markup and mock storage.
- `browser-content.ts`: scrolling, arrival, nested blocks, aliases, and recycled elements.
- `browser-surfaces.ts`: first album background thumbnails, info-card aliases, carousels, galleries/viewers, audio, independent preferences, and switch recovery.
- `browser-screen.ts`: physical screen boundaries, history scrolling, minimum readable area and explicit full blur, resizing, and navigation.
- `screen-render.test.ts`: screenshot pixel comparisons for actual backdrop blur, unchanged readable pixels, tall allowed photos crossing the mask boundary, forced media blur below it, and allowed/blocked fullscreen viewers, sharp audio controls in full/advanced mode, panel media, and background tiles.
- `browser-media.ts`: grouped containers, photo/video/sticker albums, late-loading items, repeated bottom scrolling, per-type persistent media blur, legacy-setting migration, and captions. Unknown types must not inherit an exemption accidentally.
- `browser-popup.ts`: persisted controls, alias changes, safe text, and write failures.
- Popup regressions cover reset confirmation/cancellation, visible localized data-handling footer, media choices, nested title replacement, and unread-count exclusion in sidebar lookup.
- Popup scenarios also cover master/alias switches, manual language selection, default restoration that retains aliases, ten-name suggestions, editing original names, and missing-name tooltips versus unavailable tabs.
- `tooling.test.ts`: required source languages and tooling.
- `terminal.test.ts`: Make help, release prerequisites, and Conventional Commit validation.
- `local-deploy.test.ts`: local deployment prerequisites and actual extension loading/popup initialization in Chrome through a debugging pipe, plus control and footer reachability at 160 px and 600 px viewport heights. This emulates small viewports in a tab; it is not a native toolbar-popup GUI test.
- `i18n.test.ts`: document locale mapping, Portuguese manifest default, matching catalogs, and localized build assets. Popup browser scenarios also verify Portuguese, English, and fallback messages, dynamic errors, placeholders, and accessible labels.

Jest uses SWC for transformation. Run strict type checking separately. Chrome profiles and fixtures are temporary; tests do not sign in or use a personal browser profile. Use `CHROME_BIN` for a different Chrome executable.

The harness uses headless Chrome with `--no-sandbox` against local fixtures. Host execution restrictions may still block it. Report and request the necessary execution permission instead of skipping tests.

## Manual validation

Before store distribution, check a real authenticated session:

- Sidebar and filtered lists, message arrival, switching chats, and refresh.
- Aliases in list/header, editing/removal, and duplicate names.
- Readable areas 20%, 25%, 40%, 75%, and 100%, plus explicit full blur; short chats; groups; audio, media, and albums.
- Mixed albums with many photos, video thumbnails, animated stickers, lazy loading, and repeated bottom scrolling. Test each media selection; verify allowed media stays under the screen mask and selected media stays hidden below it.
- History scrolling: old messages become readable inside the lower area; the upper area stays blurred. Check tall messages and albums crossing the boundary.
- Disabling options, preference propagation between tabs, and persistence after reload.
- Master and alias switches, language overrides, default restoration, name selection, and missing-name warnings. Test lookup with WhatsApp active, with an unrelated tab active, while signed out, and after reloading the extension.
- Advanced shortcut on/off, tooltip focus and settings navigation, individually selected media, full blur retaining its percentage, 20% minimum, and readable audio controls.
- Info cards and media carousels, galleries, and opened photos/videos: confirm aliases and selected-type protection after loading or switching assets.
- Cancel and confirm default restoration; check that the explanatory footer remains readable. Verify title replacement and suggestions for conversations with unread badges and nested title spans.

Do not commit actual messages, authentication material, or browser profiles as fixtures. Actual extension loading confirms installation and popup initialization; simulated tests are not live WhatsApp validation.

Viewer lifecycle regressions cover open/close, hidden attributes, `aria-hidden`, visibility changes, fullscreen media dialogs, and standalone viewer images. The legacy always-blur field is ignored and absent from the popup/model. These checks do not establish real WhatsApp viewer compatibility.

The viewer pixel fixture includes a generic fullscreen shell where only the main image has a viewer marker. Its sibling footer contains selected, regular, background, and video thumbnails; tests cover full image blur, independent video choices, lazy arrivals, and restoring allowed photos. Popup locale tests also check the author credit.
