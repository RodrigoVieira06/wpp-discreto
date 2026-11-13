# Chrome Web Store images

Updated for Wpp Discreto 0.2.1. Product-facing image copy is Brazilian Portuguese; development documentation and source identifiers remain English.

| Upload | File | Dimensions |
| --- | --- | --- |
| Conversation protection | `screenshot-01-conversation.png` | 1280 × 800 RGB PNG |
| Media-only protection | `screenshot-02-media.png` | 1280 × 800 RGB PNG |
| Local aliases | `screenshot-03-settings-aliases.png` | 1280 × 800 RGB PNG |
| Dark/light comparison | `screenshot-04-themes.png` | 1280 × 800 RGB PNG |
| Text-size comparison | `screenshot-05-text-size.png` | 1280 × 800 RGB PNG |
| Small promotional tile | `promo-small-440x280.png` | 440 × 280 RGB PNG |
| Marquee promotional tile | `promo-marquee-1400x560.png` | 1400 × 560 RGB PNG |
| Approved store icon | `store-icon-128.png` | 128 × 128 transparent PNG |

The icon preserves the approved artwork and its existing 96 × 96 drawing area with 16 px padding. The screenshot set uses all five available slots. No product behavior, installed icon, permission, version or manifest is changed by this asset task.

## Reproduce

```sh
make store-assets
```

The command builds the extension, prepares local demo pages, renders the seven compositions, validates their dimensions, removes alpha from screenshots/promotional exports and writes `dist/wpp-discreto-store-assets.zip`. `CHROME_BIN` selects Chrome. The portable renderer uses a temporary headless Chrome profile and a loopback-only server; it never opens a personal profile or authenticates with WhatsApp.

For a design-skill rendering session, set `STORE_SCREENSHOT_RENDERER` to the installed skill's `scripts/shoot.mjs` before running the command. The skill renders each fixed composition sequentially over local HTTP. `sources/*.html` contains the editable compositions; `.local/store-render/` contains generated demo dependencies and must be recreated before opening those sources.

## What the images show

Popup frames run the current compiled popup HTML, SCSS and JavaScript at native width, with synthetic preferences and local Chrome API mocks. Conversation frames run the actual compiled content script and protection CSS against a WhatsApp-like fictional DOM. Labels, people, messages and landscape illustrations are fictional. These are demonstrations, not authenticated WhatsApp captures or proof of compatibility with the live WhatsApp DOM.

The conversation screenshot uses preview/chat protection with a 40% readable area and a readable unread badge. The media screenshot leaves text visible while selecting all three media flags. The alias screenshot uses the saved mapping in the list/header and shows its actual editor. Theme frames show the same empty-alias state in light/dark; typography frames show General settings at 15 px and 18 px. Promotional tiles reuse the approved logo and current UI rather than generated look-alike controls.

The ZIP contains the eight individual PNG uploads and a README. Upload the extension package separately. The listing text is maintained separately and is not included in this image bundle. This command does not publish to the store.

## Official formats

Checked on 2026-11-13:

- [Complete a listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Supplying images](https://developer.chrome.com/docs/webstore/images)

The current listing guide accepts up to five screenshots, 128 × 128 store icons, 440 × 280 small promos, and 1400 × 560 marquees. The icon and at least one screenshot are required; the promotional tiles are optional.
