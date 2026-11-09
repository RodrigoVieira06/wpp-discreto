# Popup design review

The popup's main task is activating and adjusting blur. The owner confirmed this priority and requested reference-image approval before coding future landing/showcase pages. App screens continue to be refined in code.

## Findings and changes

| Finding | Change |
| --- | --- |
| Fixed body width plus vertical scrollbar caused horizontal overflow | Fit the body inside the existing 380 px viewport |
| Advanced-blur help displaced its switch | Group help with the label and align switches on the right |
| Small supporting text and saved-alias actions were hard to scan | Increase helper text to 12 px and place alias actions on a separate row |
| Settings gear and warnings depended on text glyph rendering | Use inline SVG with existing localized accessible labels |
| Tooltip positioning could depend on document scroll | Position it within viewport bounds on focus, hover, scroll, and resize |

The dark green palette, approved logo, product copy, IDs, settings, and alias behavior are preserved. No content-script or media-protection code changed.

## Evidence and limits

A regression check first failed on horizontal overflow, switch target height, and switch alignment. The corrected build passes those checks at 380 × 160 and 380 × 600, including footer/control reachability and tooltip containment.

Rendered captures cover the main controls, expanded settings, default-restoration dialog, disabled extension, and synthetic long/missing aliases in a temporary Chrome extension profile. Review artifacts are stored locally under `.local/design-preview/` and excluded from Git and distribution.

These checks use the built extension and synthetic data. They do not validate an authenticated WhatsApp session, Windows rendering, or Chrome Web Store publication.

See [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md), and the [popup surface brief](../.impeccable/surfaces/popup.md) before future interface changes.

## Design detector

Impeccable's static scan reported unlisted interaction colors, annotation sizes, and compact-action corners. These implemented values are now included in the design tokens. Its HTML hierarchy warning used fallback 16 px sizes because it could not resolve `popup.css` beside the source HTML: Sass emits that stylesheet into `dist/extension/popup`. Rendered Chrome captures show the actual 18 px title, 13 px controls, and 12 px supporting text. No detector hook or suppression was installed.
