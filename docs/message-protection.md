# Message and media protection

`src/screen.ts` owns viewport protection. `src/messages.ts` classifies individual media assets; keep its selectors aligned with `src/content.scss`.

## Screen area

`visibleArea` is the readable percentage of the conversation viewport, from 0 to 100 (default 40). The upper portion is blurred; the lower portion stays readable. At 0 the whole message viewport is protected; at 100 text is readable throughout it. Media in always mode remains protected independently.

The boundary follows physical screen coordinates, not message count or history position. Scroll any old message into the lower area to read it. A large message or album can cross the boundary: only its upper portion is masked. There are no per-message reveal exceptions or aggregate message-count wrappers.

The extension adds its own fixed, pointer-transparent backdrop overlay outside WhatsApp's React-owned tree. It measures the message scroll viewport, excludes the conversation header/composer, clips to visible bounds, and updates on scrolling, mutations, loading, window resizing, and viewport resizing. Scroll and content-mutation updates also refresh exemptions before painting; deferred rendering is not the only protection update.

Existing settings without `visibleArea` receive 40%; the old `visibleCount` is ignored rather than interpreted as a percentage. Other preferences and aliases remain intact. Both blur options still default to disabled.

## Media preferences

These preferences default to `true` when missing:

- `blurImages`: recognized photos.
- `blurVideos`: videos and recognized video thumbnails.
- `blurStickers`: recognized stickers, including image/canvas assets.
- `alwaysBlurMedia`: selected types stay blurred inside the readable area too.

They apply only while the extension and conversation protection are enabled. With always mode off, selected media follows the physical screen boundary. An exempt recognized type stays visible on both sides of the boundary. Unknown types remain protected when any media type is selected.

The overlay uses an inline SVG mask to exclude only exempt asset rectangles. Overlapping exclusions combine without exposing the space between them. Captions and album containers are not exempted. CSS independently masks selected media in always mode and unclassified new assets until synchronous classification. No React-owned text or structures are replaced, wrapped, or removed.

## Integration limits

Selectors and viewport detection depend on WhatsApp's markup. Validate real chats, tall albums, video previews, stickers, context menus, floating UI, zoom, and side panels before distribution. System notifications, search results, and separate media panels are outside the protection scope. Blur is visual protection, not encryption or access control.

Headless fixtures exercise geometry, history scrolling, grouped containers, media choices, loading, resizing, and disabled states. Screenshot pixel comparisons verify actual blur, unchanged readable pixels, and independent photo/video handling on synthetic markup. These are not authenticated WhatsApp validation.
