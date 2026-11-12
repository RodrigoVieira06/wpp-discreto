# Extension popup

## Target

popup/popup.html

## Mode

Operate

## Task

Help users activate or adjust blur first, then manage local aliases. Settings provide language, strength, readable area, full blur, media choices, and confirmed default restoration.

## Scope

Refine the existing dark green interface. Preserve the approved logo, factual copy, IDs/events, storage behavior, master/alias switches, and localized states. Do not change the chat-masking implementation.

## Layout constraints

Keep the 380 px popup viewport and normal document scrolling. Keep the title header sticky at the top with an opaque background. Reserve header space for scroll targets and move to the settings panel when opening it from the header button. Content must fit the space left by a vertical scrollbar without horizontal scrolling. Never shrink the main controls to fit a fixed footer. Settings and aliases remain reachable in short viewports.

## States to inspect

Main controls, expanded settings, aliases (including long and missing names), empty/unavailable lookup, master disabled, keyboard focus/help, and the reset confirmation dialog. Verify Portuguese and English.

## Evidence

Baseline captures in `.local/design-preview/before-*.png` show the built extension in a temporary headless Chrome profile. Sample alias/context values are synthetic and never come from a real WhatsApp session. Captures are local review artifacts, not committed assets.

## Findings and direction

- Body width plus viewport scrollbar produces horizontal overflow.
- Advanced-blur help displaces that switch from the shared right edge.
- Supporting labels and saved-alias actions need clearer hierarchy and larger targets.
- The settings gear uses a platform-dependent text glyph.
- Retain the current charcoal green, mint action color, system font, flat sections, and approved artwork. Refine spacing, contrast, focus, and states rather than replace the visual identity.

## Acceptance

Check the rendered build at 380 px width with 600 px and short viewport heights. Require visible focus, contained tooltips, aligned switches, readable long aliases, normal footer reachability, and no horizontal overflow. Existing behavior tests must pass. App screens use code-first work; the stored comp-first preference applies to future landing/showcase surfaces.

## Unread-count control

Keep unread badges readable when preview blur is enabled. Add an independent opt-in switch under Settings → Conversation list, with a concise hint explaining that WhatsApp notifications are unchanged. Reuse the media fieldset's flat divider and legend rather than adding a card or another main-panel control. Validate Portuguese/English labels, keyboard access, reset/master behavior, and exact badge pixels on shared preview containers.

## Informational help

Use one styled, nonmodal popover for all informational hints, including lookup scope and missing-alias warnings. Keep the existing action paths and confirmation dialogs. The lookup help explains passive collection and manual scrolling; place its question-mark trigger alongside the scope text. Support hover, focus, click, Escape, and outside dismissal, with viewport-contained placement and no native title tooltips.

## Help discoverability and feedback

Place only a question-mark icon inside the lookup button, with the explanation's title inside the popover. Hover and keyboard focus on the entire lookup button reveal help; clicking still runs lookup. Do not add a separate lookup-help text button. Use a quick 200 ms scale entrance with a small overshoot, retaining short opacity and control-color transitions. Skip spatial motion for reduced-motion preferences and cancel/restart safely when closing/reopening.
