# Branding assets

`assets/logo.png` is the approved full-resolution PNG with transparency: a smaller WhatsApp symbol behind a larger foreground shield. Preserve that composition when deriving assets.

Chrome icons are committed as `assets/icon-16.png`, `assets/icon-32.png`, `assets/icon-48.png`, and `assets/icon-128.png`. The manifest uses these icons for the extension listing and toolbar. The popup displays the 128 px image at 44 CSS pixels alongside the WPP Mask heading, with an empty alternative text to avoid repeating the adjacent brand name.

To regenerate icons after an explicitly approved artwork update:

```sh
make icons
make build
make check
make test
make package
```

The generation script uses Sharp only as a development tool to resize the source while retaining transparency and aspect ratio. Builds use the committed icons, so routine compilation does not regenerate or redesign the logo. Distribution includes only the icons referenced by the manifest and popup; the full-resolution source remains available in the repository and README.
