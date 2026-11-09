# Data protection policy: Wpp Discreto

Wpp Discreto runs on WhatsApp Web in the browser where you install it.

## Data use and storage

The extension reads interface elements to display local aliases and blur content. It stores your original-name mappings, aliases, and preferences in `chrome.storage.local`, without cross-device synchronization. It does not store message contents or send messages, names, aliases, or preferences to external servers. It uses no analytics, advertising, trackers, or third-party services.

Conversation suggestions read up to ten names from the active WhatsApp tab. Alias validation checks requested names against loaded conversations. These discovered names stay in memory unless you save an alias. This lookup feature reads no messages and uses no account-wide address-book API.

You can remove individual aliases in the popup. Saved data remains until you remove it or uninstall the extension.

## Permissions and effects

The `storage` permission saves local preferences and aliases. Content scripts run on `https://web.whatsapp.com/*`.

Aliases affect the display in this browser; they leave original WhatsApp names unchanged. Blur changes the visible presentation. It does not encrypt or delete content, or prevent technical access to page contents.

## Publisher details

Before Chrome Web Store publication, the publisher must add their identity and support contact and host this policy at a public URL.
