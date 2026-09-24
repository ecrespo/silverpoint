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
| T-005 – T-009 | done | 2026-09-24 | pre-existing; `packages/core/test/*` verified against every Done criterion (Node without DOM, `SP004` on `[5,5]`, production build free of warn codes, `NullInker` identity and `SP006`, line-chart snapshot and `chrome: 'bare'`, pure hit-testing) |
| T-010 | done | 2026-09-24 | `packages/grounds/test/ground.test.ts` |
| T-011 | done | 2026-09-24 | `tools/contrast-gate` reproduces Data Model §3.2; lightening `ink` 5 % fails; wired into `pnpm lint` |
| T-012 | done (browser half pending) | 2026-09-24 | `packages/fonts/test` — three cuts, `tnum` verified with fontkit, NOTICE; *blocking the font request → SP013* is verified in the example-app e2e (T-023) |
| T-013 | done (browser half pending) | 2026-09-24 | `packages/grounds/test/styles.test.ts`; *overriding `--sp-ink` recolours without re-render* is verified in the e2e (T-023) |
| T-019 | done | 2026-09-24 | `tools/svg-normalizer/normalize.test.ts` — attribute order, self-closing and entities compare equal; a differing id fails |
| T-014 | done | 2026-09-24 | `packages/grounds/test/rough-inker.test.ts`, `render.test.ts`; plus the SVG view contract (`packages/core/test/view.test.ts`) and the `renderChart` pipeline adapters share |

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

- **T-019 · Ruling:** DD-004 asks both to "normalise generated ids" and that "a differing id is
  not ignored". Both hold by normalising only *framework-generated id tokens*, by explicit list
  (`_r_N_` React ≥ 19.2 `useId`, `v-N` Vue `useId`, `ngN` the Angular adapter's counter); any
  other id — including every id derived from an `id` prop, which the fixtures always pass — is
  compared verbatim. *Cost if wrong:* a framework changing its `useId` format needs one list
  entry.

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
- **T-013 · Ruling:** the stylesheet is hand-written, and a test pins every `--sp-*` value to
  the ground tokens, so drift fails CI. Generating it from the tokens would be Art. 7 in its
  purest form, but it adds a build step for four rules. *Cost if wrong:* a second ground has
  to add its block by hand under the same test.
- **T-014 · Ruling:** the render pipeline (`renderChart`) lives in `@silverpoint/grounds`, the
  only package that sees both the core recipes and the inkers. Adapters import it, never
  `roughjs` (REQ-027). A consequence against DD-002: an app using only `precision` still bundles
  rough.js, because the inker is resolved by name at runtime. *Cost if wrong:* ~9 KB gzip,
  measured against the 45 KB budget in T-028.
- **T-014 · Ruling:** the SVG markup contract is a view model in the core (`toSvgView`) with
  every attribute already a string; each adapter template writes its fields one to one, and
  `svgString` is the canonical render. Colour is `part` + `data-paint`; a tile fill is the only
  `fill` attribute and is always `url(#…)`. *Cost if wrong:* the markup is internal (API Spec §2)
  and can change in a minor.
- **Review · Ruling (critical finding 1):** a seed of 0, or one whose `+1` wraps to 0, makes
  roughjs fall back to `Math.random`. The fix belongs where roughjs is fed — `RoughInker`
  maps every seed into a safe range, verified by test in T-014. `resolveSeed` keeps its frozen
  contract. *Cost if wrong:* none known; the derivation stays frozen by SemVer.
- **T-002 · Ruling:** "a PR adding a ground" is read as "a change touching any directory
  under `packages/grounds/src/` other than `ink/`". *Cost if wrong:* the check is stricter
  than needed on grounds refactors.
