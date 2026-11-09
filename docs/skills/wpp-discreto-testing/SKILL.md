---
name: wpp-discreto-testing
description: Apply TDD and maintain Jest and Chrome fixture regression tests for Wpp Discreto.
---

# Wpp Discreto testing

Read `AGENTS.md` and `docs/testing.md`. Identify an observable failure instead of only testing implementation details.

1. Add a failing Jest test at the appropriate layer.
2. Confirm failure for the intended reason. `make test` rebuilds browser scenarios first.
3. Implement the smallest correction and rerun.
4. Refactor while green, then run `make check` and `make test`.

For protection changes, cover new messages, recycled bubbles, scrolling, 20%/100% readable area and explicit full blur, partial tall messages/albums, viewport resizing, nested blocks, disabling protection, first background thumbnails, info-card aliases, carousels, galleries/viewers, allowed images crossing the screen boundary, selected media below it, whole-viewer type choices, viewer open/close/hidden transitions, sibling history strips outside a marked main image, selected/lazy thumbnails, independent thumbnail media types, and readable audio. For aliases, cover normalization, duplicates, safe text, row reuse, updates, and removal. For popup changes, cover persistence, failed writes, short-viewport control reachability, and footer reachability, advanced shortcut on/off, tooltip navigation, saved media choices, and full-blur percentage retention. Use screenshot pixel comparisons when changing backdrop masks; computed CSS alone does not establish visual protection.

Use mock Chrome APIs and temporary profiles. Never save user messages or authentication material as fixtures. Set `CHROME_BIN` when needed, report execution restrictions, and distinguish simulated tests from manual WhatsApp validation.

For local launcher changes, keep the actual Chrome installation smoke test in `tests/local-deploy.test.ts`: load the compiled extension, initialize its popup with real extension APIs, then close Chrome and remove the temporary profile. Never connect that smoke test to WhatsApp or a persistent personal profile.
