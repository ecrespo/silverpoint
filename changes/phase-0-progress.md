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
| T-011 | done | 2026-09-24 | `tools/contrast-gate` reproduces Data Model §3.2; lightening `ink` 5 % fails; runs as its own CI step |
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
| T-027 | done — **40 KB confirmed** | 2026-09-24 | `tools/path-weight` tests and `reports/path-weight.md`. Tile fill: line chart 2.0–2.1 KiB inked at every size; a dense card of 6 or 12 cross-hatched bars over a tone-3 area weighs 1.5–1.7 KiB, ~0.6 KiB per tonal level whatever the shape count. Per-shape: 21.0 KiB (6 bars) and 34.7 KiB (12 bars) at `md`, 14–20× the tile. DD-007's 76 KB / 913 KB figures were taken at gap 4.5 and 3 decimals; gap 7 and 2-decimal rounding brought per-shape down, but it still approaches the budget with 12 bars, where SP011 warns. No PRD amendment needed |
| T-028 | done | 2026-09-24 | `.size-limit.json` and `tools/bundle-budget/budget.real.test.ts`, min+gzip over the built packages: React client + core + LineChart **26.3 KiB** of 45 KB (rough.js and d3 included), React server 23.9, Vue 27.5, Angular 29.5, core 16.1 of 20, grounds 23.9 of 30, stylesheet 1.8 of 4, fonts 72.7 of 76 (raw woff2). A 1 kB limit makes size-limit exit non-zero |
| T-023 | done | 2026-09-24 | `e2e/apps.spec.ts` over `vite-react`, `vite-vue` (SSR prerender + `createSSRApp` hydration), `nextjs` (client chart hydrated + server chart as RSC) and `angular` (Angular CLI 21 consuming the APF build): **18 passed, 2 skipped** (the hydration case on the two client-rendered apps). All four share `examples/harness` — one stylesheet, one fixed container. Next.js and Vue: server HTML and hydrated DOM both equal the canonical render; a tampered server page is caught. Also closes the browser halves of T-012 (blocked typeface: chart still renders) and T-013 (a consumer `.sp-root { --sp-ink }` recolours the same DOM node) |
| T-024 | done | 2026-09-24 | `tools/resolution-check`: the vite-react app — barrel, `line-chart`, `server/line-chart`, grounds, fonts — builds with `vite build` shipping the ground variables, part rules and `@font-face`; serves under `vite dev` in the pinned browser with both charts rendered and no errors; its own config declares no `optimizeDeps` and no aliases; the dev build reports SP013 when the typeface is blocked. Removing `"*.css"` from grounds' `sideEffects` drops the stylesheet in a webpack-style tree-shaking bundle, and the check fails |
| T-022 | done | 2026-09-24 | `e2e/pixel.spec.ts`, goldens in `e2e/__golden__/` (8: 2 modes × 4 substrates) generated inside `mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30…` by `tools/visual-gate/pixel-docker.sh`. Every adapter (4 apps) passes the three Art. 3 comparisons against the framework-free canonical page (`canonical.html`) and the golden: **40/40** in the pinned container, and also on the host. Moving the heightened vertex by 2 px fails the gate; two consecutive screenshots are pixel-identical. CI runs the bench in the same pinned image |
| T-026 | done | 2026-09-24 | `e2e/a11y.spec.ts` over the four apps, **36/36**: axe-core (WCAG 2.1 A + AA) reports no issue on the home and fixture pages; the SVG is `role="img"` named per API Spec §10.3; the table is reachable; Tab + arrows traverse and announce; `prefers-contrast: more` and `forced-colors: active` switch to precision; `prefers-reduced-motion` drops the entry animation; with hatching disabled the series stay distinct by line and dash (REQ-124) |
| T-029 | done | 2026-09-24 | `tools/traceability` (tests + `reports/traceability.md`): REQ ids cited in test names reconciled with the PRD's MUST set and the Deferred table. The first real run flagged **REQ-105 and REQ-107 as blocking** — no test cited them — and tests were added (`packages/angular/test/apf.test.ts`, `tools/resolution-check/subpaths.real.test.ts`). Now **68/99 MUST covered, 31 deferred to phases 1-3, 0 blocking** |
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
- **T-017 · Ruling (superseded by the final review):** the Vue 3.4 fallback to the instance uid
  was wrong — the uid is a module-global counter that keeps growing across server requests, so
  server and client ids (and seeds) would differ. The peer range is now `^3.5.0` and the adapter
  calls `useId` directly; see `delta-005-vue-3-5.md`.
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
- **T-028 · Ruling:** the spec fixes only the 45 KB budget for core + react with one chart. The
  same 45 KB is declared for the Vue and Angular entries, and measured budgets with headroom for
  the rest (core 20, grounds 30, stylesheet 4, fonts 76). *Cost if wrong:* a budget to retune;
  each is one line in `.size-limit.json`.
- **T-023 · Ruling:** SP013 is a development warning stripped from production builds (API Spec
  §11), so the production example apps can only show that the chart survives a blocked typeface;
  the emission itself is verified in each adapter's unit tests and against the Vite dev server
  (T-024). *Cost if wrong:* none; it is what the spec says.
- **T-023 · Ruling:** Vue and React do not check attributes when hydrating a production build, so
  a console-only hydration check would pass a mismatched page. The bench compares the server HTML
  and the hydrated DOM with the canonical render instead, and the Vue app also enables
  `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__`. Verified by tampering with the server page.
- **T-023 · Ruling:** the ground's CSS variables are declared once per chart and at zero
  specificity (`:where(…:not(.sp-root .sp-chart))`), so a consumer re-themes with an ordinary
  `.sp-root { --sp-ink: … }`. Found by the bench: the `<svg>` redeclared them below the root.
- **T-024 · Ruling:** Vite 8 marks every CSS module side-effectful, and esbuild 0.28 keeps
  side-effect-free CSS imports too, so neither reproduces DD-011's "stylesheet silently
  disappears". Webpack does, because it treats CSS as an ordinary module. The mutation test
  therefore bundles the app with rolldown and a CSS-as-module plugin — webpack's behaviour —
  where removing `"*.css"` drops the sheet. Vite is still exercised for REQ-033 in dev and build.
  *Cost if wrong:* the guard targets the webpack family; Vite never had the defect.
- **T-024 · Ruling:** the example apps now import `@silverpoint/fonts/fonts.css` and
  `@silverpoint/grounds/styles.css` from JavaScript, as API Spec §1 documents, and the shared
  harness sheet carries only the fixed container. A CSS `@import` would have masked REQ-034.
- **T-022 · Ruling:** the golden image is the screenshot of the *canonical* page — the core's SVG
  string in the shared harness, no framework — one per fixture and shared by every adapter, so an
  adapter is never its own reference. Pixel comparison uses pixelmatch with Playwright's
  threshold semantics, because the Art. 3 "same commit" comparison is between two live
  screenshots, which `toHaveScreenshot` cannot express.
- **T-022 · Process note:** the first container run let pnpm 12 reinstall `node_modules` against a
  store inside the mount; the host install was restored and the script now sets
  `pnpm_config_verify_deps_before_run=false`.
- **Ruling · root `package.json` is read-only** in this checkout (like `specs/`), so no root
  scripts were added: CI invokes the tools directly (`pnpm exec size-limit`,
  `pnpm exec playwright test`, `pnpm exec tsx tools/…`). *Cost if wrong:* convenience scripts
  (`size`, `e2e`, `contrast`, `traceability`) can be added once the file is writable.
- **Review · Ruling (critical finding 1):** a seed of 0, or one whose `+1` wraps to 0, makes
  roughjs fall back to `Math.random`. The fix belongs where roughjs is fed — `RoughInker`
  maps every seed into a safe range, verified by test in T-014. `resolveSeed` keeps its frozen
  contract. *Cost if wrong:* none known; the derivation stays frozen by SemVer.
- **T-002 · Ruling:** "a PR adding a ground" is read as "a change touching any directory
  under `packages/grounds/src/` other than `ink/`". *Cost if wrong:* the check is stricter
  than needed on grounds refactors.

## Final review (fresh reviewer, whole branch, 2026-09-24)

No Critical findings. The reviewer also probed the three published SSR renderers with inputs
outside the fixtures (hostile text, nulls, `chrome: 'bare'`, `per-shape`, visible table, empty
data): all identical to the canonical render. Seven Important findings, all fixed in one pass:

| # | Finding | Fix | Evidence |
|---|---|---|---|
| 1 | Server `LineChart` without `id` fell back to a constant id: two charts shared ids, labels and tiles | `id` is required on the server variant at the type level | `packages/react/test/types.test.ts` RED→GREEN |
| 2 | `packages/angular/line-chart/` was not linted | ESLint globs cover every Angular entry point except `src`/`test`/`dist` | `tools/lint-rules/lint-rules.test.ts` RED→GREEN |
| 3 | CI `checks` job ran the Chromium gates on a bare runner | browser-free projects in `checks`; `--project gates` in the pinned-image `browser` job | commands run locally: 334 + 15 tests |
| 4 | Release did not wait for the Art. 3 gates | `ci.yml` is reusable; `release` `needs: ci` | workflow config |
| 5 | Vue 3.4 uid fallback breaks SSR ids across requests | peer `^3.5.0`, `useId` only | id-less Vue hydration test after a prior render, GREEN |
| 6 | `<defs>`/`<pattern>`/tile `fill` branch untested in adapters | tile-filled parity test per adapter over a toned recipe | each caught a deliberate `patternTransform` mutation |
| 7 | No id-less hydration test | React (two charts, `hydrateRoot`) and Vue (two charts, after a prior server render) | GREEN; distinct ids, no recoverable errors |

Also taken from the reviewer's disagreements: the REQ-044 ground check now runs on pushes to
`develop` over the pushed range, not only on pull requests.

**Deferred minors** (for Phase 1 or the Phase 4 close-out):
- Traceability counts `test.skip` titles and would exit 0 on a PRD with no parsable MUST rows.
- The pixel spec creates no tests if `FIXTURES` is empty; assert the count.
- The `sideEffects` mutation test rewrites the tracked `packages/grounds/package.json`; override
  `moduleSideEffects` inside rolldown instead.
- `examples/vite-react/src/canonical.ts` uses `innerHTML` (escaped core output) while TD §6 says
  "nowhere"; switch to `DOMParser` + `importNode` or record the exemption. `pnpm audit` in CI.
- The string gate compares only the `<svg>` (root, table and overlay are not gated) and only the
  React *server* entry.
- The normaliser's `\bv-\d+\b` / `\bng\d+\b` patterns also rewrite consumer ids like `v-2`.
- Consumer `id` values are not validated (a space breaks IDREFs and `url(#…)`).
- `adapter-boundary` catches `Math.*` only, not arithmetic or Angular inline-template expressions.
- `process.env.NODE_ENV` is read at runtime; unbundled browser ESM would throw.
- React 18 is in the peer range but untested.
- The five inherited LOW Analyze findings (B-01…B-05) remain as recorded in `specs/analyze.md`.

## Phase 0 close

All 29 tasks done; every Done criterion of the Implementation Plan's Phase 0 holds **except
publishing `0.1.0` to npm**, which needs the `@silverpoint` npm organisation and Trusted
Publishing configured (Plan §2 prerequisites); `.github/workflows/release.yml` is ready and has
not been run. The stop condition did not trigger: the string gate is 24/24.

Final verification, 2026-09-24: `pnpm lint` 0 errors · contrast gate 7/7 · 334 + 15 Vitest tests ·
string gate 24/24 · size-limit 8/8 · traceability 68/99 MUST covered, 31 deferred, 0 blocking ·
Playwright 94 passed, 2 skipped · pixel gate 40/40 inside the pinned image.
