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

## SSH and a Windows desktop

The browser runs on the computer executing the launcher. Running `make deploy-local` over SSH starts Chrome on the remote host, not on the SSH client's desktop. A successful extension-load message does not mean a browser window appeared on the client PC.

To test in Windows Chrome, run the source checkout and launcher from a **local PowerShell window**, with Node.js 22.18 or later, pnpm 11.23.0, Git, and Chrome installed:

```powershell
git clone https://github.com/RodrigoVieira06/wpp-discreto.git
cd wpp-discreto
pnpm install --frozen-lockfile
pnpm build
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
pnpm deploy:local
```

Adjust `CHROME_BIN` if Chrome is installed elsewhere, such as under `Program Files (x86)` or the user's local application directory. These commands use the same build and launcher as the Make target without requiring GNU Make on Windows. They must run in Windows, not in the SSH terminal or a remote Linux shell. The launcher has been tested on Linux; this Windows invocation remains unverified.

If a local launcher is unavailable, generate the ZIP with `make package` on the server, transfer and extract it on Windows, then use **Load unpacked** in `chrome://extensions` and select the extracted folder containing `manifest.json`.

The launcher uses `--remote-debugging-pipe` and `--enable-unsafe-extension-debugging` in its dedicated profile. It does not open a network debugging port. The graphical session retains Chrome's sandbox. Only automated headless smoke tests add `--no-sandbox` for their temporary test profiles.

Chrome branded builds removed ordinary `--load-extension` support starting in version 137. The launcher follows the pipe-based method demonstrated by the [official Chrome launcher test](https://github.com/GoogleChrome/chrome-launcher/blob/main/test/load-extension-test.ts). Older or unsupported browsers may reject the protocol command; use a recent Chrome or install `dist/extension` manually through `chrome://extensions`.

## Development and verification

- `make dev` watches and rebuilds sources; it does not start Chrome.
- `make deploy-local` builds and starts an interactive test session; it does not watch sources.
- `make test` loads the actual extension in a temporary headless profile and checks that the popup initializes. Other integration tests exercise simulated WhatsApp markup.
- Local loading and popup initialization are verified automatically. Message masking and aliases still need manual verification in an authenticated WhatsApp session.

## Publishing later

`make deploy` currently runs checks, tests, and packaging for manual store submission. It is not the local launcher and does not submit to the store. See [distribution](distribution.md) for the OAuth/API requirements needed to add an automated publishing target later.
