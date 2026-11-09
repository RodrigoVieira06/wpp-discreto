# Branding assets

`assets/logo.png` is the approved full-resolution PNG with transparency: a lightly blurred WhatsApp symbol with a small sharp dialogue-bubble badge overlapping its lower-right corner. Preserve that composition when deriving assets.

Chrome icons are committed as `assets/icon-16.png`, `assets/icon-32.png`, `assets/icon-48.png`, and `assets/icon-128.png`. The manifest uses these icons for the extension listing and toolbar. The popup displays the 128 px image at 40 CSS pixels alongside the Wpp Discreto heading, with an empty alternative text to avoid repeating the adjacent brand name.

To regenerate icons after an explicitly approved artwork update:

```sh
make icons
make build
make check
make test
make package
```

The generation script uses Sharp only as a development tool to resize the source while retaining transparency and aspect ratio. Builds use the committed icons, so routine compilation does not regenerate or redesign the logo. Distribution includes only the icons referenced by the manifest and popup; the full-resolution source remains available in the repository and README.

## Product naming

The public product name is **Wpp Discreto** in both locales. The package, repository, checkout directory, ZIP prefix, and project skill directories use `wpp-discreto`. Development documentation and code identifiers remain English; the DOM namespace is `data-wppd-` and the internal message type is `wpp-discreto:chat-context`. Storage keys remain `settings` and `aliases`; changing the brand does not reset them. Git history is preserved.

When renaming an unpacked extension directory, Chrome may derive a different extension ID from the new path and use separate local storage. To retain existing Windows preferences, copy the new build into the same installed directory and reload the extension and WhatsApp. Reopen the renamed checkout in development tools that saved its old path.
