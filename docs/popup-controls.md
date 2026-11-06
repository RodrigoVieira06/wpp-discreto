# Popup controls and conversation lookup

## Controls

- The master switch (`settings.enabled`, default `true`) pauses all blur and alias effects. Stored preferences and aliases remain intact.
- The aliases switch (`settings.aliasesEnabled`, default `true`) controls title decoration independently of blur.
- The gear button opens settings for `language` (`auto`, `pt_BR`, or `en`), blur intensity, recent-message count, and default restoration.
- Default restoration writes the settings defaults and retains the `aliases` array. Blur starts disabled, strength defaults to 8 px, recent count to 4, and language to automatic.
- Old saved settings migrate through `src/settings.ts`, with missing switches enabled and missing language set to `auto`.

Keep product copy factual and short. Do not add slogans, promotional empty states, or constant ready messages. Status text should communicate an action result, a failure, or an actual limitation.

## Lookup

The popup queries only the active tab ID using `chrome.tabs.query` and sends a `wpp-mask:chat-context` message to the already injected WhatsApp content script. It does not read sensitive tab properties, inject into other sites, or request additional permissions.

`src/chats.ts` reads original DOM names, not displayed aliases. Suggestions contain up to ten unique sidebar names in document order. Validation compares the saved original names with the loaded sidebar and open header; the response returns only matches for names already requested by the popup.

Selecting a suggestion fills the original-name field. Editing an existing entry fills both fields; saving with a changed original name replaces that mapping. Names and aliases are rendered as text.

## Validation states

- **Found:** the exact normalized original name is loaded; no warning.
- **Not found in loaded conversations:** the entry gets an amber border/text and a focusable warning icon with a tooltip. This does not prove the contact or group was deleted.
- **Unavailable:** no WhatsApp receiver, signed-out/empty conversation list, or a connection failure. A helper message asks the user to open or reload WhatsApp; existing aliases are not marked invalid.

Lookup runs when the popup opens, after relevant edits, and on explicit refresh. Discovered names stay in popup memory and are not stored automatically. Only a user-saved alias mapping is persisted. No messages are read for this feature and no account-wide contact API is used.

Reload the extension and refresh WhatsApp after installing this version so that the content script can receive lookup requests. Automated tests use simulated sidebar markup; live WhatsApp compatibility still needs manual validation.
