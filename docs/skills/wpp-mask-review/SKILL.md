---
name: wpp-mask-review
description: Review WPP Mask correctness, data handling, DOM integration, tests, and release readiness.
---

# WPP Mask review

Read `AGENTS.md`, the changes, and relevant tests. Prioritize actionable defects over preferences.

- Confirm strict types, SCSS compilation, and manifest resource paths.
- Check storage validation, safe text, failed writes, and permission scope.
- Look for exposure of new/recycled content before rendering and missing history masking.
- Check alias cleanup on reused rows and restoration when controls are disabled.
- Confirm regressions cover changed behavior and that checks actually ran.
- Check consistency between Make targets, package scripts, documentation, and skills.
- Distinguish simulated tests from live WhatsApp validation.
- Do not imply `make deploy` uploads or publishes.

Report defects with triggers, user-visible consequences, and file locations. If none remain, state that and identify unverified integration risks. Do not post external comments unless requested.
