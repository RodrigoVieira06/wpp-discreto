# Wpp Discreto

<img src="assets/logo.png" width="160" height="160" alt="Wpp Discreto: WhatsApp symbol with a dialogue bubble">

Customize conversation names and blur messages in WhatsApp Web without changing the original WhatsApp data.

The project is at version 0.1.7. The owner reported submitting the first Chrome Web Store release on 2026-11-09. The user confirmed manual WhatsApp Web validation on 2026-11-08. Automated tests use simulated markup.

## Features

- **Local aliases:** give groups or contacts a display name for this browser. Read names already loaded in the sidebar, filter the discovered names, or enter the original name. An amber warning identifies names absent from discovered conversations.
- **Conversation protection:** blur the upper chat area and keep the lower 20–100% readable (default: 40%). Scroll older messages into that area to read them, or enable full blur. Choose a blur strength from 4 to 16 px.
- **Media protection:** select photos, videos, or stickers to keep them blurred in full, including albums, info-card carousels, galleries, opened media, and viewer history thumbnails. Media protection works with conversation blur off. The advanced-blur switch selects all three types without changing conversation blur. Outgoing media previews stay clear while you edit and send them; protection resumes after closing the preview. Audio controls stay visible.
- **Sidebar protection:** blur message previews while keeping unread counts visible by default. An independent settings option can blur the unread counters.
- **Controls:** pause the extension or aliases without deleting saved choices. Choose automatic language, Portuguese, or English. Restoring defaults asks for confirmation and keeps aliases.

Conversation and sidebar blur start disabled, as do media choices. In a protected conversation, allowed media stays blurred above the screen boundary and clears below it. Opening media suspends that overlay: the viewer shows allowed types clearly and keeps selected types blurred. Hovering does not reveal protected content. Alias removal requires confirmation by default; its optional opt-out can be reversed in settings.

## Install from source

Use Node.js 22.18 or later, pnpm 11.23.0, Git, and GNU Make. Integration tests also need Chrome. Development has been verified with Node.js 26.2.0 on Linux.

```sh
git clone https://github.com/RodrigoVieira06/wpp-discreto.git
cd wpp-discreto
make install
make build
```

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose **`dist/extension`**.
3. Open or refresh WhatsApp Web, pin Wpp Discreto, and open its popup.
4. Enable the effects you want. The gear button opens language, blur strength, readable area, media choices, alias-deletion confirmation, and default restoration.
5. With WhatsApp Web in the active tab, use **Buscar grupos e contatos** or enter an exact original name. Save, edit, or remove aliases in the popup.

After rebuilding, reload the extension and refresh WhatsApp Web. `make dev` watches source changes; it does not reload the browser. See [popup controls](docs/popup-controls.md) and [media protection](docs/message-protection.md).

## Terminal commands

Run `make` or `make help` for the full command list.

| Command | Purpose |
| --- | --- |
| `make install` | Install locked dependencies and Git hooks |
| `make doctor` | Check local tools and Chrome |
| `make dev` | Watch sources and rebuild |
| `make deploy-local` | Open an isolated Chrome session with the extension loaded |
| `make check` | Run Biome and strict TypeScript checks |
| `make test` | Build and run Jest, including Chrome integration tests |
| `make test-watch` | Run Jest in watch mode |
| `make package` | Build `dist/extension/` and `dist/wpp-discreto-0.1.7.zip` |
| `make deploy` | Run checks, tests, and packaging for manual store submission |
| `make clean` | Remove build and coverage output |

The optional `make deploy-local` launcher uses `.local/chrome-profile/` for its login and settings. Git ignores that profile, and `make clean` preserves it. Close the session before launching again. The launcher needs a graphical desktop and Chrome with `Extensions.loadUnpacked` support; Chrome 157 was verified on Linux.

Run the launcher on the machine where you want the browser window. Over SSH, Chrome opens on the remote host. See the [local deployment guide](docs/local-deployment.md) for details and [Windows PowerShell commands](docs/local-deployment.md#ssh-and-a-windows-desktop). Windows launcher execution remains unverified.

Chrome defaults to `/usr/bin/google-chrome`. Override it as needed:

```sh
make test CHROME_BIN=/path/to/chrome
make deploy-local CHROME_BIN=/path/to/chrome
```

## Contributing

Read [AGENTS.md](AGENTS.md) before making changes. Use TypeScript with strict checking, SCSS, pnpm, Biome, and Jest with SWC. esbuild and Sass compile the extension; dependencies serve development and build tasks.

Follow TDD for behavior changes: add a failing test, confirm the failure, implement the correction, and keep the regression test. Lefthook runs checks and tests before commits and validates English Conventional Commit messages:

```text
feat: add local group aliases
fix: mask recycled message content before painting
docs: explain the terminal development workflow
```

Product copy belongs in Chrome locale catalogs. Keep source identifiers and development documentation in English. See the [documentation index](docs/README.md), [development guide](docs/development.md), [internationalization guide](docs/internationalization.md), and [project skills](docs/skills/README.md).

## Limits

Aliases match exact names rather than group IDs. Same-name conversations share an alias, including contacts; update the mapping if an original name changes. The extension does not identify groups automatically. Supported info cards show the active conversation alias, while search, member lists, descriptions, and accessibility text retain original names.

Lookup reads sidebar names without scrolling, opening chats, or changing WhatsApp ordering. Names loaded as you navigate the sidebar stay in page memory; conversations not yet loaded cannot be searched by the extension. Filter the discovered list by original name or saved alias. A spinner and loading label appear while lookup is pending. Validation uses names discovered in this page session and the open header, but an absent name may exist elsewhere in your account. The popup distinguishes an unavailable WhatsApp tab from a missing loaded name.

Unidentified media follows the selected media rules. Protection excludes system notifications, search results, and conversation titles. Blur provides visual protection; it does not encrypt content or prevent technical access to it. WhatsApp updates can break selectors, and simulated tests cannot establish compatibility with the live application.

## Data and distribution

Manifest V3 scripts run on `https://web.whatsapp.com/*` and request the `storage` permission. Preferences and aliases stay in `chrome.storage.local`; the extension stores no message contents and uses no backend. Read [DATA_POLICY.md](DATA_POLICY.md).

`make deploy` prepares a ZIP for manual submission. It does not upload to the Chrome Web Store. See [distribution](docs/distribution.md) for store materials, account setup, and remaining policy details.

Wpp Discreto is an independent project with no affiliation to WhatsApp or Meta.
