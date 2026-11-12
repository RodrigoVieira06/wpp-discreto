---
name: Wpp Discreto
description: Visual reference for the extension popup.
colors:
  surface: "#111a19"
  surface-raised: "#17231f"
  accent: "#a8efc5"
  accent-hover: "#baf5d3"
  text: "#e8eeec"
  muted: "#aebfb6"
  border: "#33453b"
  warning: "#f5c875"
  primary-text: "#153b2a"
  icon-hover: "#24372d"
  icon-active: "#2c4437"
  switch-off: "#42554b"
  switch-thumb: "#eef6f1"
  switch-on: "#43b87a"
  tooltip: "#22342a"
  label: "#c7d3cd"
  border-hover: "#597664"
  placeholder: "#a3b6aa"
  accent-active: "#8fe2b2"
  secondary: "#1c2b23"
  secondary-text: "#dce8e1"
  secondary-hover: "#293d30"
  secondary-active: "#324c3c"
  count: "#283b31"
  alias-action-text: "#c9d6cf"
  warning-surface: "#27261b"
  error: "#ffb5a6"
  modal-backdrop: "rgb(0 0 0 / 65%)"
typography:
  title:
    fontFamily: "system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.35
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: 1.5
  alias:
    fontSize: "14px"
    fontWeight: 600
  dialog-title:
    fontSize: "16px"
    fontWeight: 650
  annotation:
    fontSize: "11px"
rounded:
  compact-action: "6px"
  circle: "50%"
  badge: "4px"
  action: "8px"
  panel: "12px"
spacing:
  small: "8px"
  medium: "12px"
  panel: "16px"
  section: "20px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.action}"
    padding: "10px 12px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  text-field:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.action}"
    padding: "10px 12px"
  settings-panel:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.panel}"
    padding: "16px"
---

# Wpp Discreto design system

## Overview

Preserve the existing dark green interface, mint actions, system typography, and approved logo. Use spacing, alignment, and visible control states to make settings easy to scan. Product copy stays factual and localized.

This reference records the implementation in `popup/popup.scss`. Product constraints live in [PRODUCT.md](PRODUCT.md); popup priorities and review states live in the [surface brief](.impeccable/surfaces/popup.md).

## Colors

Use the surface color for the page and the raised surface for fields and settings. Mint identifies primary actions, range values, and keyboard focus. Muted text supports instructions and the local-data footer. Amber identifies aliases missing from loaded conversations; pair it with the warning icon and localized tooltip. Do not use color alone to communicate that state.

## Typography

Use the platform's system UI font. The product title is 18 px; section headings and controls are 13 px. Field labels, helper text, and the footer are 12 px. Saved aliases use 14 px semibold with the original name below. The alias count uses 11 px. The developer credit uses muted text, an 11 px localized label, and a 12 px medium-weight name, separated from data notices by a divider and 12 px spacing. Range values use tabular numerals.

## Layout

The popup viewport remains 380 px wide, with a maximum height of 600 px and normal vertical document scrolling. Fit the body inside the scrollbar gutter. The 73 px header stays pinned with an opaque surface while content scrolls. Root scroll padding reserves 81 px so controls and the settings panel appear below it. Opening settings scrolls to the panel. Header, main, and footer use 18 px horizontal padding. Sections use 20 px vertical padding; the settings panel uses 16 px internal padding.

Keep switches aligned to a shared right edge. Place advanced-blur help beside its label. Saved-alias actions occupy a separate row so long names can wrap. Keep the footer in document flow. Settings must remain usable at short viewport heights.

## Elevation & Depth

Use flat sections with one-pixel dividers and tonal separation for the settings panel. There are no drop shadows. The reset dialog uses the native modal layer with a 65% black backdrop. Informational hints share a bordered tonal popover in the browser top layer, positioned inside the viewport. All hints use the same hover, focus, dismissal, and click-pinning behavior; action buttons retain their action.

## Shapes

Fields and primary/secondary buttons have 8 px corners. The settings panel and dialog have 12 px corners. Switches measure 38 × 24 px with a 16 px circular thumb. Icon buttons measure 40 × 40 px; help and warning targets measure 28 × 28 px. Main switch rows are at least 44 px high.

## Components

- Primary actions use mint with dark green text, a lighter mint hover state, and a darker mint active state. Secondary actions use bordered green surfaces.
- Group the optional unread-count blur under conversation-list settings. Keep the main preview switch and the counter switch independent; default counts to readable. Reuse the existing flat fieldset, switch, and helper-text styles.
- The lookup button shows a 14 px mint spinner, a localized loading label, and `aria-busy` while pending. Respect reduced-motion preferences by stopping the spinner animation.
- Fields are at least 42 px high. Preserve visible placeholders and the mint focus border. Keyboard focus uses a 2 px mint outline with 3 px offset.
- Switches keep native checkbox semantics with `role="switch"`; labels remain clickable. Checked state moves the thumb and changes its background.
- Settings/help/warning icons use inline SVG with round strokes. Decorative SVGs are hidden from assistive technology; their controls retain localized accessible names.
- Missing aliases use an amber icon, original-name text, and a warm surface. Editing and removing remain separate keyboard-accessible actions.
- The reset dialog retains confirmation and cancellation. Disabled controls use reduced opacity and keep their saved values.

## Do's and Don'ts

- Do preserve the approved logo and the 380 px viewport.
- Do inspect Portuguese, English, long aliases, missing names, settings, and keyboard focus in the rendered extension.
- Do retain the local-data footer and author credit in normal document flow.
- Don't introduce fixed footers, horizontal scrolling, or controls compressed to fit the viewport.
- Don't add slogans, new claims, remote fonts, or decorative artwork during refinement.
- Don't change chat masking or storage behavior as part of visual styling.

## Help affordances and motion

Lookup includes a right-aligned question-mark icon within its existing button. Hover/focus on the button opens the explanation with a short title inside the help surface; clicking runs lookup. Avoid a separate help row for this action. Keep icon-only help bordered and preserve the existing advanced-blur layout.

Informational layers have a 200 ms pop entrance: 96% scale, a slight 101.2% overshoot, and a settle at 100%. Anchor the transform toward the trigger, retain the 140 ms opacity entrance and 90 ms exit, and never animate layout or delay actions. Existing 120 ms control-color feedback remains. Reduced motion removes spatial movement and retains brief 40 ms feedback.
