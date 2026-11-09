# Data protection policy — Wpp Discreto

This extension operates on WhatsApp Web in the browser where it is installed.

- It does not send messages, group names, aliases, or preferences to external servers.
- It includes no analytics, advertising, trackers, or third-party services.
- It reads interface elements to apply aliases and visual blurring. It does not store message contents.
- It stores only user-provided original names, aliases, and preferences in `chrome.storage.local`, without cross-device synchronization.
- Conversation suggestions read up to ten names from the active WhatsApp tab; alias validation checks requested names against loaded conversations. Discovered names stay in memory unless the user saves an alias mapping. The feature does not read message contents or access an account-wide address book.
- Data remains until removed by the user or the extension is uninstalled. Alias entries can be removed individually in the popup.
- The `storage` permission enables local preferences. Content scripts run only on `https://web.whatsapp.com/*`.

Blur is visual. It does not encrypt, delete, or prevent technical access to page contents. Aliases do not change actual WhatsApp group names.

Before Chrome Web Store publication, the publisher must add their identity and support contact and host this policy at an accessible URL.
