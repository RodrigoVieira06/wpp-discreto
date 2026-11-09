# Chrome Web Store listing assets

The listing copy is product-facing Brazilian Portuguese, as requested. Development documentation and source identifiers remain English.

Recommended category: **Privacy & Security** (Portuguese: **Privacidade e segurança**), based on the primary visual-protection function. This category does not imply encryption or access control.

| Field | File | Format |
| --- | --- | --- |
| Store icon | `store-icon-128.png` | 128 × 128 PNG, transparent; artwork within 96 × 96 with 16 px padding |
| Screenshot 1 | `screenshot-01-conversation.png` | 1280 × 800 RGB PNG |
| Screenshot 2 | `screenshot-02-media.png` | 1280 × 800 RGB PNG |
| Screenshot 3 | `screenshot-03-settings-aliases.png` | 1280 × 800 RGB PNG |
| Small promo tile | `promo-small-440x280.png` | 440 × 280 RGB PNG |
| Marquee promo tile | `promo-marquee-1400x560.png` | 1400 × 560 RGB PNG |
| Listing copy | `listing.pt-BR.txt` | UTF-8 text: name, short summary, detailed description |

The store icon is exported independently of the larger toolbar artwork. No installed icon, product behavior, permissions, version, or manifest changes are part of this listing work.

## Reproduce screenshots and icon

```sh
make store-assets
```

Requires Chrome, pnpm, and the existing project dependencies. `CHROME_BIN` overrides the Chrome executable. The command builds the extension, loads a temporary copy into a temporary headless profile, and adds a demo-only HTML page to that copy. It uses actual compiled content-script/CSS effects with real local extension storage containing fictitious settings and aliases. Popup lookup responses are mocked with fictitious names. No personal profile, authenticated WhatsApp, chat export, or external photo service is used.

The script verifies the viewport mask, visual alias, and selected-image blur before capture. Screenshots combine the actual popup captures with a WhatsApp-like synthetic conversation layout, labeled as a fictitious demonstration. They are not authenticated WhatsApp screenshots or proof of compatibility with the current WhatsApp DOM. The simple landscape references are synthetic placeholders.

Promotional tiles are AI-generated illustrations based on the approved logo, normalized to the upload dimensions. They illustrate blurred and readable message bars and are not UI screenshots. Their full-resolution originals are preserved in `sources/`. The command keeps the committed promo exports unchanged and includes them in the bundle when present.

`dist/wpp-discreto-store-assets.zip` contains the individual upload files and listing copy. Upload the extension ZIP separately. This command does not contact or publish to the Chrome Web Store.

## Official references

Dimensions and category checked on 2026-11-09:

- [Image requirements](https://developer.chrome.com/docs/webstore/images)
- [Complete a listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Category guidance](https://developer.chrome.com/docs/webstore/best-practices)

Only the icon and at least one screenshot are required in the current image guide. The small and marquee promotional images are optional. Check the live dashboard for remaining publisher, support, and data-policy fields before submitting.
