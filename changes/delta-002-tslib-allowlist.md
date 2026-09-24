# Delta 002 — `tslib` in the Angular adapter's runtime allowlist

| Field | Value |
|---|---|
| **Status** | `PROPOSED` |
| **Affects** | Technical Design §5.3 (runtime dependency allowlist) |
| **Raised by** | T-001, 2026-09-24; batch-1 review |

## Finding

TD §5.3 lists `@silverpoint/angular`'s runtime dependencies as `@silverpoint/core` and
`@silverpoint/grounds`, and says any addition requires an amendment. `ng-packagr` emits
code that imports `tslib` helpers, and every Angular Package Format library declares it as a
runtime dependency.

## Proposal

Amend the `@silverpoint/angular` row of TD §5.3 to add `tslib`. `tools/lint-rules/check-deps.mjs`
already carries the entry, so approving this delta changes no code.

## Constitution check

- **Art. 8** — no framework enters `dependencies`; `tslib` is a compiler helper.
- **Exception requested:** none.
