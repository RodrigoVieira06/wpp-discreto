---
name: wpp-mask-testing
description: Apply TDD and maintain Jest and Chrome fixture regression tests for WPP Mask.
---

# WPP Mask testing

Read `AGENTS.md` and `docs/testing.md`. Identify an observable failure instead of only testing implementation details.

1. Add a failing Jest test at the appropriate layer.
2. Confirm failure for the intended reason. `make test` rebuilds browser scenarios first.
3. Implement the smallest correction and rerun.
4. Refactor while green, then run `make check` and `make test`.

For protection changes, cover new messages, recycled bubbles, scrolling, zero visible messages, nested blocks, and disabling protection. For aliases, cover normalization, duplicates, safe text, row reuse, updates, and removal. For popup changes, cover persistence and failed writes.

Use mock Chrome APIs and temporary profiles. Never save user messages or authentication material as fixtures. Set `CHROME_BIN` when needed, report execution restrictions, and distinguish simulated tests from manual WhatsApp validation.
