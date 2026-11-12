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
