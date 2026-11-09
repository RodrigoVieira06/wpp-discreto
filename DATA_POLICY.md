# Data protection policy: Wpp Discreto

Last updated: 2026-11-09.

Wpp Discreto runs on WhatsApp Web in the browser where you install it.

## Data use and storage

The extension processes WhatsApp Web interface elements locally to display aliases and blur conversations and media. This includes contact and group names, which may identify people, and the visual presentation of personal communications and website content. It stores your original-name mappings, aliases, and preferences in `chrome.storage.local`, without cross-device synchronization. It does not store message contents or send messages, names, aliases, or preferences to external servers. It uses no analytics, advertising, trackers, or third-party services.

Conversation suggestions read up to ten names from the active WhatsApp tab. Alias validation checks requested names against loaded conversations. These discovered names stay in memory unless you save an alias. This lookup feature reads no messages and uses no account-wide address-book API.

You can remove individual aliases in the popup. Saved data remains until you remove it or uninstall the extension.

## Permissions and effects

The `storage` permission saves local preferences and aliases. Content scripts run on `https://web.whatsapp.com/*`.

Aliases affect the display in this browser; they leave original WhatsApp names unchanged. Blur changes the visible presentation. It does not encrypt or delete content, or prevent technical access to page contents.

## Publisher details

Publisher: Rodrigo Lima.

For support or questions about this policy, contact [rodrigovlima06@gmail.com](mailto:rodrigovlima06@gmail.com).

Public policy URL: [DATA_POLICY.md](https://github.com/RodrigoVieira06/wpp-discreto/blob/main/DATA_POLICY.md).
