# AI contribution workflow

Read [AGENTS.md](../AGENTS.md), inspect the implementation and working tree, and load the relevant [skill](skills/README.md). Preserve existing changes. Use English filenames, source code, comments, commit subjects, and development documentation.

## TDD workflow

1. Identify the observable behavior and a failure case.
2. Add or update a Jest test. Use the browser fixture for DOM behavior.
3. Run it and confirm it fails for the intended reason.
4. Implement the smallest correction in TypeScript or SCSS.
5. Rerun, then execute `make check` and `make test`.
6. Refactor while green and document changed limits.

Documentation edits do not need invented behavior tests. Validate links and command references instead.

## Completion

Report delivered behavior, checks actually executed, and remaining limits. Run `make package` after distributed assets change. Do not describe simulated Chrome tests as authenticated WhatsApp validation.

Do not add frameworks, permissions, remote scripts, telemetry, or backend services without a requirement. Do not bypass hooks or publish to the store as a development side effect. Keep Make targets, package scripts, documentation, and skills consistent.
