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
| T-015 | done (interaction in T-018) | 2026-09-24 | `packages/react/test` — server and client SSR equal to the canonical render in both modes and four substrates; server variant hook-free, rejects `onActiveChange` and requires `width`/`height` at the type level; built entries: client carries `'use client'`, server does not |
| T-016 | done (interaction in T-018; example-app consumption in T-023) | 2026-09-24 | `packages/angular/test` — the ng-packagr APF bundle, linked at runtime, server-renders through `renderApplication` identically to the canonical render in both modes and four substrates; standalone, OnPush, 28 signal inputs named as `LineChartProps`; client measurement, forced precision and public methods verified, with mutations confirming the client tests bite; `dist/package.json` exports `.` and `./line-chart` |
| T-017 | done (interaction in T-018) | 2026-09-24 | `packages/vue/test` — `@vue/server-renderer` output equal to the canonical render in both modes and four substrates; SSR → hydration with no mismatch (REQ-109); props equal to `LineChartProps` name for name; `@active-change` typed to `ActiveItem \| null`, verified with `vue-tsc` |
| T-018 | done | 2026-09-24 | core `reduceInteraction` (`packages/core/test/reducer.test.ts`) plus the same seven readout tests in each adapter (`packages/{react,vue,angular}/test/interaction.test.*`): hover and keyboard give the same readout, leave and blur emit `null` with no residue, Enter selects, a custom renderer replaces the built-in one, a polite live region announces |
| T-021 | done | 2026-09-24 | `tools/visual-gate/fixtures.test.ts` — the Data Model §5 schema validated (ids must spell their own matrix cell); 8 line-chart fixtures with committed canonical renders, checked current on every run |
| T-020 | **done — stop condition not triggered** | 2026-09-24 | `tools/visual-gate/string-gate.real.test.ts` and `pnpm --filter @silverpoint/visual-gate string-gate`: the published builds of React (`renderToStaticMarkup`), Vue (`@vue/server-renderer`) and Angular (`renderApplication`) are identical to the canonical render in **24/24** comparisons (3 adapters × 2 modes × 4 substrates). DD-004 holds as designed; no degradation to AST comparison is needed |
| T-025 | done | 2026-09-24 | `packages/grounds/test/equivalence.test.ts` — parameterised by chart, 5 variants × 5 seeds × 4 substrates; a mutation that inks encoding strokes fails every variant |
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
- **T-015 · Ruling:** API Spec §5.1 gives `locale` a default of `navigator.language` on the
  client and `'en'` on the server. Different values on each side is a hydration mismatch
  (REQ-103, and Art. 3's SSR clause), so the adapters default to the provider's locale or
  `'en'` on both sides. *Cost if wrong:* consumers wanting the browser locale pass it through the
  provider; the spec default needs a delta (`delta-003-client-locale.md`).
- **T-017 · Ruling:** REQ-108 allows no component-local reactive state beyond the measured
  width. The forced-precision flag is the *environment's* state, so it is one ref shared by
  every chart, not per component. *Cost if wrong:* none observable.
- **T-017 · Ruling:** Vue 3.4 has no `useId`; the adapter uses it when present and falls back
  to the instance uid, so the `^3.4` peer holds. *Cost if wrong:* under 3.4 the generated ids
  are not in the normaliser's list, which only matters when no `id` prop is passed.
- **T-016 · Ruling:** Angular instance ids come from a counter in a root-provided service, so
  it restarts per application — the server render and the hydrating client derive the same ids.
  A module-level counter would drift across server requests. *Cost if wrong:* none known.
- **T-016 · Ruling:** the Angular tests run against the built APF bundle rather than JIT-compiled
  sources, because signal inputs need the AOT/partial compiler; the suite therefore exercises the
  artefact that is published. *Cost if wrong:* the Angular project rebuilds before each run (~10 s).
- **T-016 · Process note:** the four Angular client tests were written after the code they cover;
  each was then checked by a deliberate mutation (forced precision, measurement, `toSVGString`)
  that made it fail, before restoring the code.
- **T-018 · Ruling:** all interaction logic is one pure core function, `reduceInteraction`
  (current item + event → next item, changed, selected, handled). Adapters forward DOM events and
  keep the result, so hover, keyboard and selection cannot diverge between frameworks. The chart
  root becomes focusable (`tabindex=0`, `role=group`) in the client components only.
- **T-018 · Ruling:** REQ-108 allows no component-local state in Vue beyond the measured width,
  but REQ-141 requires the readout to follow the active item, which is interaction state. The
  active item is kept as the one extra ref; nothing geometric is stored. *Cost if wrong:* the
  requirement's letter; `delta-004-vue-interaction-state.md` proposes the wording.
- **T-018 · Ruling:** the React client memoises the render on the props object React passes in,
  so moving the pointer never re-inks the chart. *Cost if wrong:* none; caught while wiring.
- **Review · Ruling (critical finding 1):** a seed of 0, or one whose `+1` wraps to 0, makes
  roughjs fall back to `Math.random`. The fix belongs where roughjs is fed — `RoughInker`
  maps every seed into a safe range, verified by test in T-014. `resolveSeed` keeps its frozen
  contract. *Cost if wrong:* none known; the derivation stays frozen by SemVer.
- **T-002 · Ruling:** "a PR adding a ground" is read as "a change touching any directory
  under `packages/grounds/src/` other than `ink/`". *Cost if wrong:* the check is stricter
  than needed on grounds refactors.
