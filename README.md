# Wpp Discreto

<img src="assets/logo.png" width="128" height="128" alt="Wpp Discreto">

A Chrome extension for local conversation aliases and visual message protection on WhatsApp Web.

**Status:** early development, version 0.1.0. Automated tests use a simulated interface; compatibility with an authenticated WhatsApp Web session still requires manual validation.

## Features

- **Master switch:** pause all visual effects without deleting preferences or aliases.
- **Local aliases:** customize group/contact titles and enable or disable aliases independently.
- **Conversation picker:** select one of the first ten names loaded in the active WhatsApp tab.
- **Name validation:** highlight aliases whose original name is absent from the loaded conversations, with a warning icon and explanatory tooltip.
- **Blur chat previews:** conceal message previews in the sidebar.
- **Protect conversations:** blur the upper conversation area and keep a configurable lower area readable (20–100%, default: 40%), or explicitly enable full text blur.
- **Advanced blur:** opt into all photo/video/sticker protections at once, then customize individual types in settings. Audio controls remain visible.
- **Adjustable blur:** choose an intensity between 4 and 16 px.
- **Local preferences:** save settings and aliases without sending them to a backend.
- **Settings panel:** choose automatic language, Portuguese, or English; adjust protection levels; restore settings without deleting aliases.
- **Media choices:** select photos, videos, and stickers to keep them blurred in full, including in the readable area. Allowed media still blurs inside the protected conversation area. These choices apply while conversation protection is on, including info-card carousels, galleries, and opened media. Opening media suspends the conversation overlay: allowed types are fully clear in the viewer, selected types remain fully blurred. Media options start disabled; saved choices are preserved.

Scroll older messages into the lower readable area to read them. The boundary follows the screen, including across tall messages and albums. Hovering does not remove the blur. Both protection options start disabled.

## Stack

TypeScript with strict checking, SCSS, Chrome Manifest V3, esbuild, pnpm, Biome, Jest with SWC, and Lefthook with commitlint for Conventional Commits. Tooling is installed as development dependencies; the extension bundles local scripts without a backend.

## Get started

Requirements: Node.js 22.18 or later, pnpm 11.23.0, Git, and GNU Make. Chrome is required for integration tests. The verified development environment uses Node.js 26.2.0 on Linux.

```sh
git clone https://github.com/RodrigoVieira06/wpp-discreto.git
cd wpp-discreto
make install
make build
```

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose **`dist/extension`**.
3. Open or refresh WhatsApp Web, pin Wpp Discreto, and open its popup.
4. Use the master switch to enable the extension and select the desired effects. Open the gear button for language, blur intensity, readable screen percentage, and default restoration.
5. Open WhatsApp Web in the active tab. Use **Buscar grupos e contatos** to pick a loaded name, or enter an exact original name manually. Save an alias, edit it, or remove it from the list.

Restoring defaults asks for confirmation and resets settings only; saved aliases are retained. The popup footer explains what stays local and unchanged. See [popup controls](docs/popup-controls.md) and [media protection](docs/message-protection.md).

## Terminal workflow

Run `make` or `make help` to discover all commands.

| Command | Purpose |
| --- | --- |
| `make install` | Install locked dependencies and Git hooks |
| `make doctor` | Check local tools and Chrome |
| `make dev` | Watch sources and rebuild the extension |
| `make deploy-local` | Build and load the extension automatically in a separate Chrome test session |
| `make check` | Run Biome and strict TypeScript checks |
| `make test` | Build and run Jest, including Chrome integration tests |
| `make test-watch` | Run Jest in watch mode |
| `make package` | Build the extension and ZIP |
| `make deploy` | Run checks and tests, then prepare a ZIP for manual store submission |
| `make clean` | Remove generated build and coverage output |

After a development rebuild, reload the extension in `chrome://extensions` and refresh WhatsApp Web. Development mode does not automatically reload a live chat.

### Install locally from the terminal

```sh
make deploy-local
```

This builds the extension, opens Chrome with a separate persistent profile, loads Wpp Discreto through the Chrome DevTools Protocol, and opens WhatsApp Web and the extensions page. Sign in to WhatsApp once in that window. Close it or press Ctrl+C in the terminal to stop. After changing the code, close the test window and run the command again.

The test profile lives in `.local/chrome-profile/`, is ignored by Git, and survives `make clean`. The command does not change your regular Chrome profile. Keep only one local deployment session open at a time. A graphical desktop and a recent Chrome with `Extensions.loadUnpacked` support are required; Chrome 157 was verified here. See the [local deployment guide](docs/local-deployment.md).

Run the launcher on the computer where you want the browser window. SSH execution opens Chrome on the remote computer. For a Windows desktop, see the [local PowerShell instructions](docs/local-deployment.md#ssh-and-a-windows-desktop); Windows execution has not yet been verified.

Chrome defaults to `/usr/bin/google-chrome`. Override it when needed:

```sh
make test CHROME_BIN=/path/to/chrome
make deploy-local CHROME_BIN=/path/to/chrome
```

Output: `dist/extension/` for local installation and `dist/wpp-discreto-0.1.0.zip` for distribution. Generated files are ignored by Git.

## Contributing and AI assistance

Read [AGENTS.md](AGENTS.md) before changing behavior. Use TDD: reproduce the expected behavior with a failing test, implement the change, and keep the regression test.

Lefthook runs checks and tests before commits and validates Conventional Commit messages:

```text
feat: add local group aliases
fix: mask recycled message content before painting
docs: explain the terminal development workflow
```

See the [documentation index](docs/README.md), [development guide](docs/development.md), and [project skills](docs/skills/README.md).

Product copy lives in Chrome locale catalogs; see [internationalization](docs/internationalization.md). Source identifiers and development documentation remain in English.

## Current limitations

- Aliases match exact original names, not stable group IDs. All same-name conversations, including contacts, receive the same alias. Update the entry if the original name changes.
- Groups are not identified automatically. Search, accessibility text, member lists, and descriptions retain original names. Supported info cards display the active conversation alias.
- Suggestions use up to ten unique names already loaded in the active tab, not the entire address book. Validation can check other loaded conversation names and the open header, but cannot establish whether an absent name exists elsewhere in your account. An unavailable WhatsApp tab is reported separately.
- Media types that cannot be identified remain protected according to the selected media rules. Chat albums, info-card media, galleries, and opened media are covered; search remains outside scope.
- Protection does not cover system notifications, search results, or conversation titles. Blur is not encryption or access control.
- WhatsApp changes can break DOM selectors. Simulated tests do not establish live-application compatibility.

## Data handling and distribution

Scripts run only on `https://web.whatsapp.com/*` and request the `storage` API permission. Settings and aliases stay local; message contents are not stored. Read [DATA_POLICY.md](DATA_POLICY.md).

`make deploy` prepares a local release; it does not upload to the Chrome Web Store. See the [distribution guide](docs/distribution.md) for manual verification, store materials, and remaining policy details.

Independent project. Not affiliated with WhatsApp or Meta.
