# Message and media protection

`src/screen.ts` controls viewport protection. `src/messages.ts` classifies media assets; keep its selectors aligned with `src/content.scss`.

## Screen area

`visibleArea` sets the readable lower portion of the conversation viewport, from 20 to 100% (default: 40%). The upper mask covers text, media, captions, and avatars. Audio controls remain exempt. Allowed media cannot create holes in this mask: an image crossing the boundary stays blurred above it and sharp below it.

`fullBlur` defaults to `false`. Enabling it covers the full conversation viewport and retains the preferred percentage. At 100%, the viewport mask has no height, but selected media types keep their own blur. Scroll older content into the lower area to read it; protection uses screen coordinates rather than message-count exceptions.

The extension adds a fixed overlay outside React's tree at the highest normal stacking index. It passes pointer events through to WhatsApp. Geometry excludes the header/composer, clips to visible bounds, and updates on scrolling, mutations, loading, and resizing. An inline SVG mask excludes audio controls. Scroll/content callbacks update geometry before painting, without depending solely on deferred rendering.

## Media choices

| Setting | Effect while conversation protection is enabled |
| --- | --- |
| `blurImages` | Blur photos in full |
| `blurVideos` | Blur videos and recognized video thumbnails in full |
| `blurStickers` | Blur stickers, including image/canvas assets, in full |

Missing fields default to `false`; preserve explicit saved choices. Selected types stay blurred below the chat boundary and in info-card carousels, galleries, opened media, and viewer history. Allowed types follow the boundary in the conversation and stay clear in panels/viewers. Unidentified assets remain protected if any media type is selected.

The advanced-blur shortcut enables chat protection and selects all three types. Turning it off clears media choices while retaining chat protection. Its tooltip explains this behavior and opens individual settings. Audio waveforms and playback UI remain visible, including in full and advanced modes.

CSS masks unclassified assets until synchronous classification. Treat CSS background thumbnails as assets even if they contain an icon or child; do not filter an aggregate album wrapper as one asset. Preserve React-owned text and structures.

## Opened media and history

A visible supported viewer suspends the chat viewport overlay. Individual type filters remain active: allowed photos are clear throughout the viewer; selected photos blur in full. Explicit video/sticker indicators take priority over photo detection. A large displayed image can count as a photo, while small unidentified previews retain conservative handling.

Detection covers explicit viewer surfaces and large media dialogs. If the displayed image carries the only known marker, discovery includes its enclosing positioned fullscreen shell. This covers sibling history strips, including selected, background-image, and newly loaded thumbnails, even inside a generic footer. Stop discovery before application, conversation, sidebar, or document roots.

Hidden, zero-size, and `aria-hidden` viewers leave chat protection active. Closing or hiding a viewer restores the chat mask; reopening a mounted viewer suspends it again. Info cards and galleries do not generally suspend it.

## Settings migration

Settings without `visibleArea` receive 40%. Ignore the old `visibleCount`. A legacy value of `visibleArea: 0` enables full blur; values 1–19 clamp to 20. Preserve aliases and other preferences. Conversation and sidebar blur default to disabled.

The `alwaysBlurMedia` field and control were removed. Ignore its stored value; selected types now determine persistent media blur. The next settings save writes supported preferences only.

## Validation and limits

WhatsApp markup determines selector and viewport compatibility. Before distribution, check integration changes against real albums, opened photos/videos/stickers, thumbnail strips, zoom, dialogs, floating UI, and group histories. System notifications and search are outside scope. Blur does not encrypt content or prevent technical access to it.

Headless fixtures cover geometry, history, resizing, viewer lifecycle, media choices, audio, and disabled states. Pixel comparisons cover a tall allowed image crossing the boundary at maximum stacking index, selected media below it, allowed/blocked fullscreen images, panel/background assets, independent thumbnail types, and sharp audio. These tests use synthetic markup, not an authenticated WhatsApp session.
