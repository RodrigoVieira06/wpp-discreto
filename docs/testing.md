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
- `browser-content.ts`: scrolling, arrival, levels, nested blocks, aliases, and recycled elements.
- `browser-popup.ts`: persisted controls, alias changes, safe text, and write failures.
- `tooling.test.ts`: required source languages and tooling.
- `terminal.test.ts`: Make help, release prerequisites, and Conventional Commit validation.
- `local-deploy.test.ts`: local deployment prerequisites and actual extension loading/popup initialization in Chrome through a debugging pipe.
- `i18n.test.ts`: document locale mapping, Portuguese manifest default, matching catalogs, and localized build assets. Popup browser scenarios also verify Portuguese, English, and fallback messages, dynamic errors, placeholders, and accessible labels.

Jest uses SWC for transformation. Run strict type checking separately. Chrome profiles and fixtures are temporary; tests do not sign in or use a personal browser profile. Use `CHROME_BIN` for a different Chrome executable.

The harness uses headless Chrome with `--no-sandbox` against local fixtures. Host execution restrictions may still block it. Report and request the necessary execution permission instead of skipping tests.

## Manual validation

Before store distribution, check a real authenticated session:

- Sidebar and filtered lists, message arrival, switching chats, and refresh.
- Aliases in list/header, editing/removal, and duplicate names.
- Levels 0, 3, 4, and 12; short chats; groups; audio, media, and albums.
- History scrolling and returning to the bottom without exposing older messages.
- Disabling options, preference propagation between tabs, and persistence after reload.

Do not commit actual messages, authentication material, or browser profiles as fixtures. Actual extension loading confirms installation and popup initialization; simulated tests are not live WhatsApp validation.
