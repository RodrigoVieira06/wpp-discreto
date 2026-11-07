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

For protection changes, cover new messages, recycled bubbles, scrolling, 0%/100% readable area, partial tall messages/albums, viewport resizing, nested blocks, and disabling protection. For aliases, cover normalization, duplicates, safe text, row reuse, updates, and removal. For popup changes, cover persistence, failed writes, short-viewport control reachability, and footer reachability. Use screenshot pixel comparisons when changing backdrop masks; computed CSS alone does not establish visual protection.

Use mock Chrome APIs and temporary profiles. Never save user messages or authentication material as fixtures. Set `CHROME_BIN` when needed, report execution restrictions, and distinguish simulated tests from manual WhatsApp validation.

For local launcher changes, keep the actual Chrome installation smoke test in `tests/local-deploy.test.ts`: load the compiled extension, initialize its popup with real extension APIs, then close Chrome and remove the temporary profile. Never connect that smoke test to WhatsApp or a persistent personal profile.
