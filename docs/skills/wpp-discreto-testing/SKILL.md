---
name: wpp-discreto-testing
description: Follow TDD and maintain Jest and Chrome regression tests for Wpp Discreto.
---

# Wpp Discreto testing

Read `AGENTS.md` and `docs/testing.md`. Identify the observable failure before changing behavior.

1. Add a failing Jest test at the relevant layer.
2. Confirm the intended failure. `make test` rebuilds browser scenarios first.
3. Implement the smallest correction and rerun.
4. Refactor while green, then run `make check` and `make test`.

## Regression coverage

- **Protection:** arrivals, recycling, scrolling, 20%/100% readable area, full blur, tall messages/albums crossing the boundary, resizing, nested blocks, and disabled states.
- **Media:** first background tiles, selected types below the boundary, allowed/blocked fullscreen assets, sibling history outside the main image marker, selected/lazy thumbnails, independent thumbnail types, media-only protection on initial load and live updates, master-switch recovery, and readable audio. Include info cards, carousels, galleries, and viewer open/close/hidden transitions. Cover outgoing-editor draft assets, Ctrl+V with split preview/caption roots and unfamiliar send icons, new thumbnails, send/cancel recovery, and negative cases for normal composers and received viewers.
- **Aliases:** normalization, duplicates, plain text, reused rows, updates, and removal.
- **Popup:** saved choices, write errors, controls/footer in short viewports, advanced shortcut, tooltip navigation, passive sidebar discovery with no scroll or native reordering, pending loading states, filtering, deletion confirmation and opt-out, and percentage retention during full blur.

Use screenshot pixel comparisons for backdrop-mask changes. A computed CSS property does not prove that pixels blurred.

Use mock Chrome APIs and temporary profiles. Keep real messages, credentials, and personal browser profiles out of fixtures. Set `CHROME_BIN` as needed; report execution restrictions and distinguish simulated tests from manual WhatsApp checks.

For launcher changes, retain `tests/local-deploy.test.ts`: load the compiled extension through Chrome's debugging pipe, initialize its popup with real APIs, close Chrome, and remove the temporary profile. Do not sign into WhatsApp or use a persistent personal profile in this test.
