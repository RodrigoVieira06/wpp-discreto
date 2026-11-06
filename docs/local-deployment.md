# Local deployment

## One-command installation

```sh
make deploy-local
```

The target runs a fresh build and starts `scripts/deploy-local.ts`. The launcher opens Chrome, loads the compiled extension through `Extensions.loadUnpacked`, then opens the extensions page and WhatsApp Web. It reports the extension ID only after Chrome confirms successful loading.

Sign in to WhatsApp in this separate window. The persistent profile at `.local/chrome-profile/` preserves the test login and extension settings between runs. It is ignored by Git and excluded from packaging. Never commit browser profiles. `make clean` removes build output, not this login.

Close the test window or press Ctrl+C to stop. After editing code, close the session and run `make deploy-local` again to rebuild and load the latest version. Keep one session open at a time; Chrome locks profiles already in use. This command does not install into or modify the ordinary Chrome profile.

## Browser requirements

A graphical desktop and a recent Chrome supporting the experimental `Extensions.loadUnpacked` DevTools method are required. Chrome 157 was verified on Linux. Select a different executable with:

```sh
make deploy-local CHROME_BIN=/path/to/chrome
```

The launcher uses `--remote-debugging-pipe` and `--enable-unsafe-extension-debugging` in its dedicated profile. It does not open a network debugging port. The graphical session retains Chrome's sandbox. Only automated headless smoke tests add `--no-sandbox` for their temporary test profiles.

Chrome branded builds removed ordinary `--load-extension` support starting in version 137. The launcher follows the pipe-based method demonstrated by the [official Chrome launcher test](https://github.com/GoogleChrome/chrome-launcher/blob/main/test/load-extension-test.ts). Older or unsupported browsers may reject the protocol command; use a recent Chrome or install `dist/extension` manually through `chrome://extensions`.

## Development and verification

- `make dev` watches and rebuilds sources; it does not start Chrome.
- `make deploy-local` builds and starts an interactive test session; it does not watch sources.
- `make test` loads the actual extension in a temporary headless profile and checks that the popup initializes. Other integration tests exercise simulated WhatsApp markup.
- Local loading and popup initialization are verified automatically. Message masking and aliases still need manual verification in an authenticated WhatsApp session.

## Publishing later

`make deploy` currently runs checks, tests, and packaging for manual store submission. It is not the local launcher and does not submit to the store. See [distribution](distribution.md) for the OAuth/API requirements needed to add an automated publishing target later.
