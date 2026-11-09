---
name: wpp-discreto-review
description: Review Wpp Discreto correctness, data handling, DOM integration, tests, and release readiness.
---

# Wpp Discreto review

Read `AGENTS.md`, the diff, and relevant tests. Report defects that affect behavior or maintenance, with a trigger, user-visible consequence, and file location.

Check:

- Strict types, SCSS compilation, and manifest paths.
- Storage validation, plain-text rendering, write failures, and permission scope.
- Content exposed before rendering, stale viewport/audio geometry, media holes, and incorrect viewer suspension during scrolling.
- Alias cleanup on reused rows and restoration after disabling effects.
- Regression coverage and the checks the contributor ran.
- Agreement between Make targets, package scripts, documentation, and skills.
- Claims about simulated versus authenticated WhatsApp validation.
- Distribution wording: `make deploy` prepares files for manual submission.

If you find no defects, state that and list unverified integration risks. Post external comments only when requested.
