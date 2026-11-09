# Branding assets

The user selected `assets/logo.png` for the first store release: a transparent PNG with a sharp WhatsApp symbol and a larger sharp dark-green dialogue bubble at the lower right. Neither symbol has blur. Preserve this composition when resizing.

Preview future artwork changes and obtain explicit approval before applying them or pushing them to GitHub.

## Icons

Chrome uses the committed `assets/icon-16.png`, `icon-32.png`, `icon-48.png`, and `icon-128.png`. The popup displays the 128 px icon at 40 CSS pixels beside the Wpp Discreto heading. Its empty alternative text avoids repeating that heading.

After an approved artwork update, run:

```sh
make icons
make build
make check
make test
make package
```

The Sharp development script trims excess transparent canvas, adds a transparent margin of 5% of the trimmed artwork on each side, and resizes while preserving aspect ratio. This gives the artwork more space inside Chrome's fixed icon slot. The approved full-resolution source remains unchanged. Builds use the committed icons without regenerating artwork. The ZIP includes the referenced icons; the repository and README retain the full-resolution source.

## Names and paths

The product name is **Wpp Discreto** in both locales. The package, repository, checkout directory, ZIP prefix, and project skill directories use `wpp-discreto`. Keep development documentation and code identifiers in English. DOM attributes use `data-wppd-`; internal messaging uses `wpp-discreto:chat-context`.

Storage keys remain `settings` and `aliases`; rebranding preserves those values and Git history. Renaming an unpacked extension directory can cause Chrome to derive a different ID and use separate storage. To retain Windows preferences, copy the build into the installed directory, then reload the extension and WhatsApp. Reopen the renamed checkout in tools that saved the old path.
