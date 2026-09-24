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

## Rulings

- **T-001 · Ruling:** the Angular adapter compiles with Angular 21 and TypeScript 5.9. Angular
  22's compiler requires TypeScript ≥ 6.0, and the Constitution's stack table pins
  TypeScript 5.x. Partial-compilation APF output is linked by Angular 22 as well, so the
  peer range stays `>=21 <23`. *Cost if wrong:* validating 22 at build time needs a
  Constitution amendment to TypeScript 6 — see `delta-001-typescript-6.md`.
- **T-002 · Ruling:** `tslib` is allowlisted for `@silverpoint/angular`: it is the runtime
  helper every APF library ships with. *Cost if wrong:* one allowlist entry in TD §5.3.
- **T-002 · Ruling:** "a PR adding a ground" is read as "a change touching any directory
  under `packages/grounds/src/` other than `ink/`". *Cost if wrong:* the check is stricter
  than needed on grounds refactors.
