# Popup controls and conversation lookup

## Controls

The master switch (`settings.enabled`) and aliases switch (`settings.aliasesEnabled`) default to `true`. Turning either off retains preferences and mappings. The master switch pauses every effect; the aliases switch pauses title decoration.

The gear button opens language, blur strength, readable area, media choices, and default restoration. The readable percentage ranges from 20–100. Full blur covers the conversation viewport and disables the slider without changing its saved value. Audio controls stay readable.

The advanced-blur switch selects photos, videos, and stickers without changing conversation blur. Turning it off clears those media choices while retaining the conversation-blur preference. Individual media choices also work when conversation blur is off. The question-mark button displays a localized tooltip and opens individual media settings.

Selected media types stay blurred in full, including below the chat screen boundary and in panels/viewers. Allowed media stays under the chat mask and clears below its boundary. Opening a supported media viewer suspends that mask; the media-type choice then determines its blur. The former always-blur control is removed, and legacy values are ignored. See [media protection](message-protection.md).

Default restoration opens a localized confirmation dialog. Cancel or Escape writes nothing. Confirmation resets settings and retains the `aliases` array: blur off, strength 8 px, readable area 40%, automatic language, and media choices off. Older settings receive enabled master/alias switches and language `auto` when those fields are missing.

Use factual copy that explains actions, failures, or limits. Omit slogans, promotional empty states, and persistent ready messages.

## Sidebar preview and unread-count controls

The main preview switch affects message previews only. The settings panel groups `blurUnreadCounts` under “Conversation list”, with its own switch and explanatory hint. It defaults to `false`, including when migrating saved `blurPreviews: true`, and works independently of preview protection. Neither option changes WhatsApp notification behavior. The master switch disables both effects; restoring defaults clears the unread-count preference.

`src/sidebar.ts` recognizes semantic unread-count markers and accessible labels, with a numeric rounded-green-badge fallback in the preview cell. It annotates separate preview and counter targets; it never wraps or replaces native text. Counter-only blur retains previews, timestamps, and original DOM text. Shared containers are partitioned so their composited filter cannot blur a protected counter by inheritance.

## Layout and footer

Keep the popup 380 px wide, with intrinsic control heights and normal document scrolling. The title header stays at the top with `position: sticky`; its opaque background covers scrolled content. Root scroll padding leaves room for the 73 px header plus an 8 px gap, keeping focused and scrolled-to controls clear of it. Opening settings with the header button scrolls the settings panel into view below the header; closing it does not request another scroll. Place the footer in document flow so you can reach it by scrolling. A fixed footer or `100vh` height constraint must not compress the controls.

Retain the footer's data-handling explanation: changes affect this browser, original WhatsApp names/messages remain unchanged, and the extension does not send or save conversation contents. Place the developer credit in its own footer area, separated from the data notices by a divider and spacing. Show the localized label “Desenvolvido por” or “Developed by” above “Rodrigo Lima”, using muted text, an 11 px label, and a 12 px medium-weight name. Keep the credit in normal document flow.

## Lookup and editing

The popup gets the active tab ID through `chrome.tabs.query` and sends `wpp-discreto:chat-context` to the installed content script. It reads no sensitive tab properties, injects into no other site, and requests no extra permission.

`src/chats.ts` reads original DOM names without programmatic scrolling or clicks. It collects names rendered as the user navigates WhatsApp. Titles are read in visual row order, including recycled DOM rows. Cached blocks follow the observed relative order; no alphabetical sorting or native-list mutation occurs. Validation compares requested saved names against current and cached sidebar names, the open header, and supported active info-card title.

Prefer an inner title over an aggregate container. Exclude unread indicators and accessibility counters. Alias CSS clips nested original spans without deleting or replacing React text, preventing the original and alias from appearing together.

Selecting a suggestion fills the original-name field. Editing fills both fields; saving with a changed original replaces that mapping. Render names and aliases as plain text. Supported info cards display the active conversation alias; member lists, descriptions, and original DOM text remain unchanged.

## Validation states

| State | Display |
| --- | --- |
| Found | No warning for an exact normalized name in discovered conversations |
| Not found in discovered conversations | Amber border/text and a focusable warning icon with a tooltip |
| Unavailable | A helper asks you to open or reload WhatsApp; saved aliases receive no invalid-name warning |

An absent discovered name does not establish that the group or contact was deleted. Unavailable includes a missing receiver, signed-out or empty list, and connection failures.

Lookup runs on popup opening, relevant edits, and explicit refresh. The button displays a spinner and localized loading label while its request is pending; `aria-busy` marks the button and result area. The popup filters all discovered names and saved aliases without case or accent distinctions, with result counts and empty-match guidance.

Lookup never scrolls or changes WhatsApp's order. It cannot discover conversations the page has never rendered. Names loaded through user navigation stay in memory, and replacing the sidebar or reloading clears that directory. Filtered and archived conversations outside the rendered list remain outside its scope. The extension persists a mapping only when saved; lookup reads no messages and uses no account-wide contact API.

After updating the extension, reload it and refresh WhatsApp so the content script can receive lookup requests. Automated lookup tests use simulated markup; check changes against WhatsApp before distribution.

## Alias deletion

Removal opens a localized dialog naming the alias. Cancel and Escape leave storage unchanged. The optional “do not ask again” checkbox takes effect only after confirming a successful deletion; the aliases and `settings.confirmAliasRemoval: false` are saved together. A failed save keeps the dialog open with an error and retains both the alias and prior preference.

`confirmAliasRemoval` defaults to `true` for missing or invalid saved values. The settings panel can reenable it. Default restoration also reenables confirmation without deleting saved aliases. Opting out applies only to alias deletion, not the independent default-restoration dialog.

## Informational popovers

Use `popup/info-popover.ts` for all informational hints in the popup. Add `data-info` with a catalog key to the trigger and bind it with the shared controller. Dynamically rendered alias warnings use the same component. Do not add native `title` tooltips or separate hover-only surfaces.

The single styled `popover` surface uses the browser top layer to escape scroll containers. Hover, keyboard focus, or click reveals help; Escape, outside pointer input, blur, scrolling, or resizing dismisses it. During scrolling, keyboard-focused help stays positioned beside its trigger while that trigger remains within the viewport. Pointer users can move into the text without immediately dismissing it. Click pins help until dismissed. Existing action buttons retain their action and close help when activated (for example, media help opens settings). The active trigger references the tooltip through `aria-describedby`; content uses text-only localized catalog lookup.

The lookup button includes a question-mark SVG at its right edge. Hovering or focusing anywhere on that button shows a titled explanation: “Como encontrar mais conversas?”. Clicking retains the lookup action. The icon is decorative inside the button, not a nested interactive control. The explanation covers already-loaded sidebar names, manually scrolling WhatsApp, and running lookup again; filtering only searches collected names.

Help layers fade in over 140 ms and out over 90 ms. A 200 ms entrance grows from 96% to 101.2% and settles at 100%, anchored toward the trigger. Positioning uses untransformed dimensions, and repeated focus/scroll updates do not restart the entrance. Closing cancels the animation; reopening starts a fresh one. Control colors and switch thumbs retain 120 ms feedback. Reduced-motion mode skips the scale/translation, shortens fades and color feedback to 40 ms, removes switch travel, and stops the spinner. No action is delayed.
