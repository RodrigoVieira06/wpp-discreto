# Popup controls and conversation lookup

## Controls

The master switch (`settings.enabled`) and aliases switch (`settings.aliasesEnabled`) default to `true`. Turning either off retains preferences and mappings. The master switch pauses every effect; the aliases switch pauses title decoration.

The gear button opens language, blur strength, readable area, media choices, and default restoration. The readable percentage ranges from 20–100. Full blur covers the conversation viewport and disables the slider without changing its saved value. Audio controls stay readable.

The advanced-blur switch enables chat protection and selects photos, videos, and stickers. Turning it off clears those media choices while retaining chat protection. The question-mark button displays a localized tooltip and opens individual media settings.

Selected media types stay blurred in full, including below the chat screen boundary and in panels/viewers. Allowed media stays under the chat mask and clears below its boundary. Opening a supported media viewer suspends that mask; the media-type choice then determines its blur. The former always-blur control is removed, and legacy values are ignored. See [media protection](message-protection.md).

Default restoration opens a localized confirmation dialog. Cancel or Escape writes nothing. Confirmation resets settings and retains the `aliases` array: blur off, strength 8 px, readable area 40%, automatic language, and media choices off. Older settings receive enabled master/alias switches and language `auto` when those fields are missing.

Use factual copy that explains actions, failures, or limits. Omit slogans, promotional empty states, and persistent ready messages.

## Layout and footer

Keep the popup 380 px wide, with intrinsic control heights and normal document scrolling. The title header stays at the top with `position: sticky`; its opaque background covers scrolled content. Root scroll padding leaves room for the 73 px header plus an 8 px gap, keeping focused and scrolled-to controls clear of it. Opening settings with the header button scrolls the settings panel into view below the header; closing it does not request another scroll. Place the footer in document flow so you can reach it by scrolling. A fixed footer or `100vh` height constraint must not compress the controls.

Retain the footer's data-handling explanation: changes affect this browser, original WhatsApp names/messages remain unchanged, and the extension does not send or save conversation contents. Place the developer credit in its own footer area, separated from the data notices by a divider and spacing. Show the localized label “Desenvolvido por” or “Developed by” above “Rodrigo Lima”, using muted text, an 11 px label, and a 12 px medium-weight name. Keep the credit in normal document flow.

## Lookup and editing

The popup gets the active tab ID through `chrome.tabs.query` and sends `wpp-discreto:chat-context` to the installed content script. It reads no sensitive tab properties, injects into no other site, and requests no extra permission.

`src/chats.ts` reads original DOM names. Suggestions contain up to ten unique sidebar names in document order. Validation compares requested saved names against the loaded sidebar, open header, and supported active info-card title. It returns matches for those requests.

Prefer an inner title over an aggregate container. Exclude unread indicators and accessibility counters. Alias CSS clips nested original spans without deleting or replacing React text, preventing the original and alias from appearing together.

Selecting a suggestion fills the original-name field. Editing fills both fields; saving with a changed original replaces that mapping. Render names and aliases as plain text. Supported info cards display the active conversation alias; member lists, descriptions, and original DOM text remain unchanged.

## Validation states

| State | Display |
| --- | --- |
| Found | No warning for an exact normalized name in loaded conversations |
| Not found in loaded conversations | Amber border/text and a focusable warning icon with a tooltip |
| Unavailable | A helper asks you to open or reload WhatsApp; saved aliases receive no invalid-name warning |

An absent loaded name does not establish that the group or contact was deleted. Unavailable includes a missing receiver, signed-out or empty list, and connection failures.

Lookup runs on popup opening, relevant edits, and explicit refresh. Discovered names stay in memory. The extension persists a mapping only when you save it; lookup reads no messages and uses no account-wide contact API.

After updating the extension, reload it and refresh WhatsApp so the content script can receive lookup requests. Automated lookup tests use simulated markup; check changes against WhatsApp before distribution.
