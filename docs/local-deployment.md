# Local deployment

## One-command installation

```sh
make deploy-local
```

This optional target builds the extension and starts `scripts/deploy-local.ts`. The launcher loads the build through `Extensions.loadUnpacked`, then opens the extensions page and WhatsApp Web. It prints the extension ID after Chrome confirms loading.

Sign into WhatsApp in this separate window. `.local/chrome-profile/` retains the test login and settings between runs. Git and packaging exclude that profile, and `make clean` preserves it. Keep browser profiles out of commits.

Close the window or press Ctrl+C to stop. After editing code, close the session and rerun the command. Chrome locks profiles in use, so keep one session open at a time. The launcher uses a dedicated profile and leaves your ordinary Chrome profile unchanged.

## Browser requirements

Use a graphical desktop and Chrome with the experimental `Extensions.loadUnpacked` method. Chrome 157 was verified on Linux. To choose another executable:

```sh
make deploy-local CHROME_BIN=/path/to/chrome
```

## SSH and a Windows desktop

The browser opens on the machine running the launcher. Over SSH, it opens on the remote host. A successful load message does not establish that a window opened on your Windows desktop.

To run the launcher on Windows, open a local PowerShell window with Node.js 22.18 or later, pnpm 11.23.0, Git, and Chrome installed:

```powershell
git clone https://github.com/RodrigoVieira06/wpp-discreto.git
cd wpp-discreto
pnpm install --frozen-lockfile
pnpm build
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
pnpm deploy:local
```

Adjust `CHROME_BIN` if Chrome lives under `Program Files (x86)` or your user directory. These commands run the Make target's build and launcher without requiring GNU Make. Run them in Windows, outside the SSH terminal. The launcher has been tested on Linux; this Windows invocation remains unverified.

For manual loading, build on the server and copy `dist/extension` to Windows. You can also run `make package`, transfer the ZIP, and extract it. In `chrome://extensions`, use **Load unpacked** and select the directory containing `manifest.json`.

## Launcher behavior

The dedicated profile uses `--remote-debugging-pipe` and `--enable-unsafe-extension-debugging`, without a network debugging port. Interactive Chrome retains its sandbox. Automated headless smoke tests add `--no-sandbox` for temporary profiles.

Chrome branded builds removed ordinary `--load-extension` support in version 137. The launcher follows the [official Chrome launcher pipe test](https://github.com/GoogleChrome/chrome-launcher/blob/main/test/load-extension-test.ts). If your browser rejects the protocol method, use a recent Chrome or load `dist/extension` manually.

`make dev` watches and rebuilds without starting Chrome. `make deploy-local` builds and launches without watching. `make test` loads the extension in a temporary headless profile and checks popup initialization; other integration scenarios use simulated WhatsApp markup. Check masking and aliases in an authenticated session after integration changes.

## Publishing later

`make deploy` runs checks, tests, and packaging for manual store submission. It neither launches the local browser nor submits to the store. See [distribution](distribution.md) for automation prerequisites.
