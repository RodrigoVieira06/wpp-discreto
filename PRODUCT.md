# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

WhatsApp Web users who want local visual protection and conversation aliases. Brazilian Portuguese is the default product language; English is available. The owner confirmed that activating and adjusting blur should have priority when opening the popup.

## Product Purpose

Wpp Discreto changes the display of WhatsApp Web in one browser. Users can blur sidebar previews, protect an upper conversation area, keep selected media blurred, and assign local aliases. Original WhatsApp names and messages remain unchanged.

## Operating Context

Users open a Chrome extension popup while using WhatsApp Web. The owner tests by copying the unpacked build to Windows and loading it manually in Chrome; development runs on Linux over SSH. This owner workflow does not imply an OS restriction for the extension.

The popup is an existing 380 px desktop surface. Preserve its width, intrinsic control heights, natural scrolling, and existing functional paths. Refinement must not repeat the earlier regression that compressed the controls beneath a fixed footer.

## Capabilities and Constraints

- Manifest V3 runs on WhatsApp Web with the storage permission. Preferences and aliases stay in local browser storage, with no extension backend, analytics, or transmission of chat contents.
- Master and alias switches retain saved choices when disabled. Default restoration requires confirmation and keeps aliases. Alias deletion requires confirmation by default; a confirmed opt-out persists locally and can be reversed in settings.
- Readable conversation area ranges from 20–100%, default 40%. Full blur is a separate setting. Media choices work independently of conversation blur. The media checkbox changes media choices only and explicitly indicates partial selection. Selected media stays blurred throughout supported conversations and media viewers; audio controls remain readable. Outgoing previews and editing controls stay clear while preparing a media message, with normal protection restored after sending or canceling.
- Aliases use exact original names. Lookup reads already-rendered sidebar names and caches them in page memory without scrolling, clicking chats, or changing native order, with accent-insensitive filtering and a loading state in the popup; missing loaded names and an unavailable WhatsApp tab are different states.
- Sidebar preview blur preserves unread message counts by default. An independent opt-in setting under the conversation-list group can blur the counters without changing WhatsApp notifications.
- Settings use a separate view with a Back action that restores main scroll/focus. Saved aliases precede an editor opened through Add alias, Edit, or conversation selection. Canceled drafts are not stored; settings navigation preserves them.
- Appearance supports automatic system, light, and dark themes through local preferences. A named header button switches the resolved theme; General settings can restore automatic mode. Themes affect only extension UI. Text size also applies only to this popup, defaults to 15 px, and can be set from 14–18 px. Do not add a schematic blur preview; the user checks the real conversation.
- Browser language selects Portuguese or English; users can save an override. Keep documentation and source identifiers in English.
- The popup footer must explain local-only changes and unchanged WhatsApp data, and retain the Rodrigo Lima author credit.
- Blur is visual protection, not encryption or access control. WhatsApp DOM changes can affect compatibility.

## Brand Commitments

The approved name is Wpp Discreto. Preserve the sharp WhatsApp mark and sharp larger lower-right dialogue bubble in `assets/logo.png`. Future artwork changes require an approved preview before application or GitHub publication.

Use factual copy without slogans or promotional claims. Retain existing product copy during visual refinement unless the owner authorizes wording changes.

## Evidence on Hand

The repository contains the approved logo, a working popup, Portuguese/English catalogs, and Chrome integration/pixel tests with synthetic content. The owner confirmed manual WhatsApp validation on 2026-11-08. Automated tests do not observe authenticated WhatsApp behavior. The data policy identifies Rodrigo Lima and the support email rodrigovlima06@gmail.com. Store publication remains separate work; contact email verification takes place in the publisher dashboard.

## Product Principles

1. Make blur activation and adjustment easy to find.
2. Keep user data and visual edits local to the browser.
3. Preserve saved aliases and preferences across disabled states and visual refinements.
4. Explain protection limits and data handling in plain language.
