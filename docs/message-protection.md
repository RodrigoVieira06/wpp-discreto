# Message and media protection

`src/screen.ts` owns viewport protection. `src/messages.ts` classifies media assets; keep its selectors aligned with `src/content.scss`.

## Screen area

`visibleArea` is the readable percentage of the conversation viewport, from 20 to 100 (default 40). The upper portion blurs all conversation content, including photos, videos, stickers, captions, and avatars. Only audio-player UI remains exempt. Media must never cut holes in this mask, even when its type is allowed. A tall allowed image crossing the boundary is blurred above it and sharp below it.

`fullBlur` is a separate explicit switch (default false) that covers the full conversation viewport while retaining the preferred percentage. At 100 the viewport mask has no height; selected media types still remain blurred independently. Scroll old content into the lower readable area to read it. There are no message-count reveal exceptions.

The extension adds its own fixed, pointer-transparent overlay outside WhatsApp's React-owned tree at the highest normal stacking index. It measures the message scroll viewport, excludes the header/composer, clips to visible bounds, and updates on scrolling, mutations, loading, and resizing. An inline SVG mask excludes audio controls only. Scroll/content updates refresh geometry before painting. Deferred rendering is not the only protection update.

Existing settings without `visibleArea` receive 40%; the old `visibleCount` is ignored. Legacy `visibleArea: 0` migrates to explicit full blur; values 1–19 clamp to 20. Aliases and other preferences remain intact. Both blur options still default to disabled.

## Media preferences

These preferences default to `false` when missing; explicit saved choices are preserved:

- `blurImages`: photos stay blurred in full.
- `blurVideos`: videos and recognized video thumbnails stay blurred in full.
- `blurStickers`: stickers, including their image/canvas assets, stay blurred in full.

A selected type stays hidden throughout the conversation, including its readable area, and in info-card carousels, galleries, and opened media. An unselected type follows the viewport boundary in the conversation and stays clear in panels/viewers. Unknown assets remain protected when any media type is selected.

The former `alwaysBlurMedia` setting and popup control are removed. Its legacy stored value is ignored; type choices now determine persistent media blur directly. The next settings save serializes only supported preferences. The advanced-blur shortcut enables conversation protection and selects all three types; switching it off clears them while retaining conversation protection. Its tooltip explains the behavior and opens individual media settings.

Media rules apply only while the extension and conversation protection are enabled. CSS protects unclassified new assets until synchronous classification. Background thumbnails are actual assets even if they contain an icon or child. Aggregate album wrappers are not filtered as one asset. Audio waveforms and playback UI stay visible, including in full and advanced modes. React-owned text and structures are not replaced, wrapped, or removed.

## Opened media

A visible supported media viewer suspends the conversation viewport overlay. The opened asset itself follows the selected type: an allowed photo is clear everywhere, while a selected photo is blurred in full. Other selected types must not incorrectly classify a large displayed photo as unknown. Explicit video/sticker indicators still take priority; small unidentified preview tiles retain conservative handling.

Viewer detection includes explicit viewer surfaces and large media dialogs. When only the displayed image has a known viewer marker, asset discovery also includes its enclosing positioned fullscreen shell, covering sibling history strips (including selected, background-image, and newly loaded thumbnails). Discovery stops before application, conversation, sidebar, or document roots. Inferred shells are media surfaces even when the history strip uses a generic footer. Hidden, zero-size, or `aria-hidden` viewers do not suspend protection. Closing/hiding the viewer restores the conversation mask; reopening a mounted viewer suspends it again. Individual media filters remain active during these transitions. Info cards and media galleries do not generally suspend conversation protection.

## Integration limits and validation

Selectors and viewer/viewport detection depend on WhatsApp markup. Manually check real albums, opened photos/videos/stickers, thumbnail strips, zoom, dialogs, floating UI, and group histories before distribution. System notifications and search are outside scope. Blur is visual protection, not encryption or access control.

Headless fixtures exercise geometry, history, resizing, viewer lifecycle, media choices, audio, and disabled states. Screenshot comparisons cover an allowed tall image across the mask boundary (including maximum stacking index), fully selected media below that boundary, whole-viewer allowed/blocked images, panel/background assets, viewer history strips with independent type preferences, and sharp audio. They use synthetic markup, not an authenticated WhatsApp session.
