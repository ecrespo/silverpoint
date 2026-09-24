# Phase 0 — execution ledger

`specs/` is read-only in this checkout, so `tasks.md` is not ticked in place: this file is
the ledger the Implementation Plan §6 asks for, and it is folded into `tasks.md` when the
phase closes. Every task is built test-first (RED → GREEN); test names cite their `REQ-NNN`.

## Tasks

| Task | State | Date | Evidence |
|---|---|---|---|
| T-001 | done | 2026-09-24 | `pnpm -r build` green; `check-deps` passes on the real manifests |
| T-002 | done | 2026-09-24 | `tools/lint-rules/*.test.ts` — fixtures with `Math.random()`, `import 'd3-scale'` in an adapter, and a PR touching a ground and `core/src/charts` each fail |
| T-003 | done | 2026-09-24 | pre-existing; `packages/core/test/render.test.ts` (REQ-002, REQ-011) verified green |
| T-004 | done | 2026-09-24 | pre-existing; five frozen FNV-1a pairs verified against the reference values |

## Batch-1 review (fresh reviewer, 2026-09-24)

Critical 1 is fixed in T-014. Important 2 (lint evasions: destructuring, alias, `globalThis`,
`Date()`, computed keys, `crypto`), 3 (Vue template expressions), 4 (`tslib` → delta 002),
5 (Angular peer range), 6 (ground check on release PRs) and 7 (`check-deps` ignoring peer
and optional dependencies, and not asserting `types` first) are fixed, each with a test seen
failing first where code changed.

**Deferred minors:**
- `import x = require('d3-scale')` and `import('d3-scale').T` type queries are not caught.
- `checkConditionOrder` does not recurse into nested condition objects; no resolution test yet (T-024).
- The ground check only recognises grounds that live in a subdirectory of `grounds/src`.
- The `@silverpoint/source` condition points at `./src`, which is not published; strip it at pack time.
- `round2(1.005)` gives `1` (binary floating point); the ≤ 2-decimals guarantee holds.

## Rulings

- **T-001 · Ruling:** the Angular adapter compiles with Angular 21 and TypeScript 5.9. Angular
  22's compiler requires TypeScript ≥ 6.0, and the Constitution's stack table pins
  TypeScript 5.x. Partial-compilation APF output is linked by Angular 22 as well, so the
  peer range stays `>=21 <23`. *Cost if wrong:* validating 22 at build time needs a
  Constitution amendment to TypeScript 6 — see `delta-001-typescript-6.md`. The peer range is
  narrowed to `>=21 <22` until then (batch-1 review, finding 5).
- **T-002 · Ruling:** `tslib` is allowlisted for `@silverpoint/angular` pending
  `delta-002-tslib-allowlist.md`. *Cost if wrong:* one allowlist entry in TD §5.3.
- **Review · Ruling:** the ground-PR check runs only on pull requests into `develop`; a
  release PR into `main` spans many unrelated ground and chart changes. *Cost if wrong:* a
  ground PR merged straight into `main` is not checked.
- **Review · Ruling (critical finding 1):** a seed of 0, or one whose `+1` wraps to 0, makes
  roughjs fall back to `Math.random`. The fix belongs where roughjs is fed — `RoughInker`
  maps every seed into a safe range, verified by test in T-014. `resolveSeed` keeps its frozen
  contract. *Cost if wrong:* none known; the derivation stays frozen by SemVer.
- **T-002 · Ruling:** "a PR adding a ground" is read as "a change touching any directory
  under `packages/grounds/src/` other than `ink/`". *Cost if wrong:* the check is stricter
  than needed on grounds refactors.
