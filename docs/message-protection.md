# Message and media protection

`src/messages.ts` isolates message-unit discovery, media classification, and text annotation. Keep its selectors aligned with `src/content.scss`.

## Message units

A wrapper containing multiple message elements is not a reveal unit. The implementation selects the innermost message elements, including supported message IDs, and preserves at most the configured number of recent units at the conversation end. Scrolling into history revokes those exceptions. An album represented by a single message element can contain multiple assets; its assets are masked independently.

This prevents a grouped `msg-container` from exposing a whole conversation when it happens to be one of the last few wrappers.

## Media preferences

The settings panel exposes four preferences, all defaulting to `true` when missing from old settings:

- `blurImages`: recognized photo assets.
- `blurVideos`: videos and recognized video thumbnails.
- `blurStickers`: recognized stickers, including their image/canvas assets.
- `alwaysBlurMedia`: selected types remain blurred even within recent revealed messages.

They apply only while the extension and open-conversation protection are enabled. When always mode is off, selected media follows the recent-message exceptions. An explicitly exempt recognized type remains visible while older captions stay masked. If all media types are off, only message text is protected.

Unknown assets conservatively follow the protection for selected media instead of inheriting a type exemption. New assets are masked in CSS before classification; classification runs synchronously in the mutation-observer microtask. Pure layout/style changes do not revoke recent-message exceptions, while changes to message identity/content do. Load and metadata events trigger a position refresh.

## Mixed messages

Filtering an entire mixed-media parent would also blur exempt types, and revealing that parent could expose all album items. The implementation therefore masks visual assets and caption/text parents separately. Direct caption text sharing a media parent uses text-only masking without a parent image filter. Text nodes and React-owned structures are not replaced or wrapped; annotations use `data-wppm-` attributes only.

## Integration limits

Classification depends on WhatsApp's markup and media indicators. Unknown types may stay masked even when a specific type is exempt. Current protection targets chat albums and messages; system notifications and separate search/media panels are not covered by this change.

Headless fixtures cover grouped containers, mixed albums, new items, repeated loading/scrolling, per-type exemptions, always mode, captions, and disabling protection. They do not validate an authenticated WhatsApp session. Check real albums, video thumbnails, animated stickers, and group histories manually before distribution.
