# Tasks — Phase 0, vertical slice

> Source specs: [PRD](prd.md) v1.7 · [API Spec](api-spec.md) v1.5 ·
> [Technical Design](technical-design.md) v1.3 · [Data Model](data-model.md) v1.1 ·
> [Implementation Plan](implementation-plan.md) v1.3
> Plan phase covered: **Phase 0** · Generated: 2026-09-13 · Revised: 2026-09-13 (Vue adapter)

Phase 0 only. The template is explicit: more than 40 tasks means it should have been split
per phase, and phases 1 to 3 are repetition over the engines built here. Theirs are
generated as each preceding phase closes.

## Conventions

- Order is execution order except where `[P]` appears.
- States: `[ ]` pending · `[~]` in progress · `[x] date` done · `[!]` blocked.
- **Agent execution: the first batch is T-001 to T-004, then review, adjust, and only then
  scale.** Do not launch all 29 unsupervised.

## Tasks

### Scaffolding

**[ ] T-001 · Monorepo and empty packages**
- **What**: pnpm workspaces plus Nx; the six allowlist packages with their `package.json`, `strict` `tsconfig` and an `exports` map whose condition order puts `import` before `default`; `sideEffects: false` everywhere **except** `*.css`; React, Vue and Angular declared as `peerDependencies`; empty `examples/` and `tools/`.
- **REQ**: REQ-034, REQ-160, REQ-161, REQ-163
- **Files**: `pnpm-workspace.yaml`, `nx.json`, `packages/*/package.json`
- **Depends on**: —
- **Done**: `pnpm -r build` green with empty packages; no adapter declares React, Vue or Angular as a dependency; `sideEffects` lists `*.css` in `grounds`.

**[ ] T-002 · ESLint boundary rules** `[P]`
- **What**: custom rule banning `Math.random` and `Date.now` under `packages/*/src`; rule banning `d3-*` and `roughjs` imports from `react` and `angular`; rule enforcing the core runtime allowlist; CI check that a PR adding a ground touches no file under `packages/core/src/charts/**`.
- **REQ**: REQ-004, REQ-027, REQ-044, REQ-106, REQ-162
- **Files**: `tools/lint-rules/`
- **Depends on**: T-001
- **Done**: a fixture with `Math.random()`, one with `import 'd3-scale'` in an adapter, and a PR touching both `grounds/` and `core/src/charts/` each fail.

**[ ] T-003 · Public types and serialisation** `[P]`
- **What**: the types from API Spec §3; `round2()` and the `Geometry` serialiser.
- **REQ**: REQ-002, REQ-011
- **Files**: `packages/core/src/types/`, `packages/core/src/render/`
- **Depends on**: T-001
- **Done**: round-trip test `JSON.parse(JSON.stringify(geometry))` lossless, and no coordinate carries more than 2 decimals.

**[ ] T-004 · Seed derivation**
- **What**: 32-bit FNV-1a for `string → number`; resolution `seed ?? derive(id)`.
- **REQ**: REQ-003, REQ-005
- **Files**: `packages/core/src/render/seed.ts`
- **Depends on**: T-003
- **Done**: two calls with the same input give the same seed; a regression test freezes five known pairs, because changing the function is a *major*.

--- *review here before continuing* ---

### Core

**[ ] T-005 · Scale engine**
- **What**: `linear` and `band` over `d3-scale`; own `extent`/`max`/`min`; degenerate-domain expansion.
- **REQ**: REQ-001, REQ-010
- **Files**: `packages/core/src/scales/`
- **Depends on**: T-003
- **Done**: the package imports and runs under Node with no DOM; a `[5,5]` domain yields a usable range and emits `SP004`.

**[ ] T-006 · Diagnostics**
- **What**: `diagnose()` with the thirteen codes `SP001`–`SP013`, a single message template, strippable via `NODE_ENV`.
- **REQ**: REQ-007, REQ-008, REQ-009, REQ-010, REQ-032
- **Files**: `packages/core/src/diagnostics/`
- **Depends on**: T-003
- **Done**: a production build contains no `SP0` string except those of severity `error`.

**[ ] T-007 · `Inker` interface and `NullInker`**
- **What**: the interface from API Spec §3.2 and the null object; the registry that resolves an inker by name and falls back when it is unknown.
- **REQ**: REQ-020, REQ-021, REQ-026
- **Files**: `packages/core/src/ink/`
- **Depends on**: T-003
- **Done**: `NullInker.ink(g)` returns `g` unaltered and uncopied; an unregistered inker name falls back to `NullInker` and emits `SP006`; `packages/core` still has no `roughjs` in `dependencies`.

**[ ] T-008 · Line chart recipe**
- **What**: `props + scales → Geometry`, with the correct `role` on every stroke; `chrome: 'bare'` support.
- **REQ**: REQ-060, REQ-093, REQ-094, REQ-095
- **Files**: `packages/core/src/charts/line-chart/`
- **Depends on**: T-005, T-006
- **Done**: snapshot of the `Geometry` with the demo dataset; calling it without `data` returns the demo dataset; `chrome: 'bare'` emits the plot area and nothing else.

**[ ] T-009 · Hit-testing engine** ⟵ *closes Analyze finding A-03*
- **What**: resolution of the active item as a **pure function** of pointer position and `Geometry`, with no DOM access; proximity resolution for touch with a 24 px minimum target.
- **REQ**: REQ-140, REQ-144
- **Files**: `packages/core/src/interaction/`
- **Depends on**: T-008
- **Done**: runs under Node with no DOM; given a `Geometry` and a coordinate it returns the expected `ActiveItem`; a coordinate outside the plot area returns `null`.

### Ground and typography

**[ ] T-010 · Ground schema and `silverpoint` tokens**
- **What**: the schema from API Spec §6 and the values from Data Model §3, all four substrates; ground registry with fallback.
- **REQ**: REQ-040, REQ-045, REQ-046
- **Files**: `packages/grounds/src/silverpoint/`
- **Depends on**: T-003
- **Done**: `registerGround` registers; an unknown ground name falls back to `silverpoint` and emits `SP007`.

**[ ] T-011 · Contrast gate** `[P]`
- **What**: script computing WCAG ratios of every ink against every substrate of every registered ground.
- **REQ**: REQ-126, REQ-127
- **Files**: `tools/contrast-gate/`
- **Depends on**: T-010
- **Done**: reproduces the table in Data Model §3.2; lightening `ink` by 5% fails CI.

**[ ] T-012 · Typeface package** `[P]`
- **What**: EB Garamond 400, 500 and 400 italic as latin-subset woff2, their `@font-face` rules, and a `NOTICE` carrying the OFL; load-failure detection reporting `SP013`.
- **REQ**: REQ-032 · DD-010
- **Files**: `packages/fonts/`
- **Depends on**: T-001
- **Done**: `tnum` verifiable by a test comparing the advance widths of `1` and `8`; the `NOTICE` names the authors and the licence; blocking the font request emits `SP013` and the chart still renders.

**[ ] T-013 · Stylesheet and `part` mapping**
- **What**: `styles.css` with the `--sp-*` variables and the rules that paint by `part`.
- **REQ**: REQ-041, REQ-042, REQ-043
- **Files**: `packages/grounds/src/styles.css`
- **Depends on**: T-010
- **Done**: overriding `--sp-ink` in a consumer stylesheet recolours without re-rendering; no Tailwind anywhere in the dependency tree.

**[ ] T-014 · `RoughInker` with tile fill**
- **What**: inking over `rough.js`; `<pattern>` tiles per tonal level with instance-scoped ids; `hatchFill: 'per-shape'` as the alternative; heightening outline.
- **REQ**: REQ-022, REQ-023, REQ-024, REQ-025, REQ-029, REQ-030, REQ-031
- **Files**: `packages/grounds/src/ink/rough-inker.ts`
- **Depends on**: T-007, T-010
- **Done**: the endpoints of `role='encoding'` strokes do not move; two charts on one page do not share a tile id; every `sp-heighten` carries an `sp-ink` outline; declaring two heightened elements throws in development and applies only the first in production.

### Adapters

**[ ] T-015 · React adapter and `LineChart`**
- **What**: provider, config resolution, `ResizeObserver` measurement, stroke mapping; client and server entry points; `chrome` support.
- **REQ**: REQ-095, REQ-100, REQ-104, REQ-107
- **Files**: `packages/react/src/`
- **Depends on**: T-008, T-014
- **Done**: the server variant emits no client JavaScript and rejects `onActiveChange` at the type level.

**[ ] T-016 · Angular adapter and `sp-line-chart`**
- **What**: standalone component with signal inputs and `OnPush`; `provideSilverpoint`; `ng-packagr` build; `chrome` support.
- **REQ**: REQ-095, REQ-101, REQ-102, REQ-105
- **Files**: `packages/angular/src/`
- **Depends on**: T-008, T-014
- **Done**: the artifact is valid APF and is consumed from the example app; T-002's lint confirms no maths in the adapter.

**[ ] T-017 · Vue adapter and `SpLineChart`**
- **What**: components with `<script setup>`, typed props and typed emits; `provideSilverpoint` plugin; `tsup` build with the SFC step; `chrome` support.
- **REQ**: REQ-095, REQ-100, REQ-102, REQ-107, REQ-108
- **Files**: `packages/vue/src/`
- **Depends on**: T-008, T-014
- **Done**: props match the React adapter name for name; `@active-change` is typed to `ActiveItem | null`; T-002's lint confirms no maths in the adapter.

**[ ] T-018 · Readout wired in all three adapters** ⟵ *closes Analyze finding A-03*
- **What**: connect the T-009 engine to pointer and keyboard events in all three adapters; emit `onActiveChange` / `@active-change` / `activeChange`; default readout plus the consumer-supplied renderer slot.
- **REQ**: REQ-141, REQ-142, REQ-143
- **Files**: `packages/react/src/interaction/`, `packages/vue/src/interaction/`, `packages/angular/src/interaction/`
- **Depends on**: T-009, T-015, T-016, T-017
- **Done**: hover and keyboard focus both surface the same readout; leaving the plot area or losing focus emits `null` and leaves no residual state; a custom renderer replaces the built-in one.

### Gates

**[ ] T-019 · SVG normaliser**
- **What**: parse to tree, sorted attributes, rounded numbers, resolved entities, explicit filtering of `ng-*`, `_ngcontent-*` and `ngh`, and normalisation of generated ids.
- **REQ**: REQ-180 · DD-004
- **Files**: `tools/svg-normalizer/`
- **Depends on**: T-003
- **Done**: two strings differing only in attribute order, self-closing style and entities compare equal; a differing `id` is **not** ignored and fails.

**[ ] T-020 · Cross-adapter string gate** ⟵ *the risk-retiring task*
- **What**: SSR render of all three adapters under Node — `renderToStaticMarkup`, `@vue/server-renderer`, `renderApplication` — each compared against the fixture's canonical render through the normaliser.
- **REQ**: REQ-103, REQ-109, REQ-180
- **Files**: `tools/visual-gate/string-gate.ts`
- **Depends on**: T-015, T-016, T-017, T-019
- **Done**: the line chart is identical across the 3 adapters × 2 modes × 4 substrates, each against the canonical render. **If it is not, the phase stops and the plan's stop condition applies.**

**[ ] T-021 · Fixture matrix**
- **What**: the schema from Data Model §5, including the `canonical` reference render, and the line chart's fixtures.
- **REQ**: REQ-182
- **Files**: `fixtures/`
- **Depends on**: T-008
- **Done**: 8 line-chart fixtures load and validate against the schema, each with its canonical render committed.

**[ ] T-022 · Pixel gate**
- **What**: Playwright on a digest-pinned image, `deviceScaleFactor: 1`, animations disabled, `document.fonts.ready`; the three Art. 3 thresholds.
- **REQ**: REQ-181
- **Files**: `tools/visual-gate/pixel-gate.ts`
- **Depends on**: T-021, T-023
- **Done**: golden images generated; moving a vertex by 2 px fails; two consecutive runs do not differ.

**[ ] T-023 · Example apps with a shared harness**
- **What**: `vite-react`, `vite-vue`, `nextjs` and `angular`, all four on **the same stylesheet** and the same fixed-size container. They are the integration bench, not demos.
- **REQ**: REQ-103
- **Files**: `examples/*`
- **Depends on**: T-015, T-016, T-017
- **Done**: all four boot and show the line chart; Next.js and the Vue SSR entry both hydrate with no mismatch.

**[ ] T-024 · Bundler resolution check**
- **What**: assert that every subpath resolves under `vite dev` and under `vite build`, that neither needs an `optimizeDeps` entry, and that `import '@silverpoint/grounds/styles.css'` survives tree-shaking in a production build.
- **REQ**: REQ-033, REQ-034
- **Files**: `tools/resolution-check/`, `examples/vite-react`
- **Depends on**: T-001, T-023
- **Done**: both modes green; removing `"*.css"` from `sideEffects` makes the check fail; adding an `optimizeDeps.include` entry to the example is not required for any import.

### Phase close-out

**[ ] T-025 · `ink` / `precision` equivalence**
- **What**: test comparing the vertices of `role='encoding'` strokes across both modes.
- **REQ**: REQ-006
- **Depends on**: T-014
- **Done**: identical for the line chart; the test is parameterised so later phases only append charts to the list.

**[ ] T-026 · Line chart accessibility**
- **What**: role and name, tabular alternative, keyboard traversal, automatic `precision` activation, `prefers-reduced-motion`; review that no information is carried by hatch style alone.
- **REQ**: REQ-120, REQ-121, REQ-122, REQ-123, REQ-124, REQ-125
- **Depends on**: T-015, T-016, T-017, T-018
- **Done**: `axe-core` reports no A or AA issues across all four apps; forcing `prefers-contrast: more` switches to `precision`; the chart is legible with hatching disabled.

**[ ] T-027 · Path-weight measurement** ⟵ *the missing number*
- **What**: deliberately dense hatched card; measure `d` bytes with `tile` and with `per-shape`.
- **REQ**: PRD NFR §7
- **Depends on**: T-014
- **Done**: the 40 KB figure is **confirmed or corrected with data**, and the PRD is amended if needed.

**[ ] T-028 · Bundle budgets** `[P]`
- **What**: `size-limit` across the six packages.
- **REQ**: REQ-164
- **Depends on**: T-015, T-016, T-017
- **Done**: `core` + `react` with the line chart under 45 KB; exceeding it breaks CI.

**[ ] T-029 · Automated traceability**
- **What**: script extracting the `REQ-NNN` cited in test names and reconciling them against the PRD's `MUST` set.
- **REQ**: REQ-183, REQ-184
- **Files**: `tools/traceability/`
- **Depends on**: T-025, T-026
- **Done**: emits the coverage report that feeds the Analyze gate; a `MUST` with no test appears in the list.

## Traceability matrix — Phase 0

| REQ | Tasks |
|---|---|
| REQ-001 | T-005 |
| REQ-002, REQ-011 | T-003 |
| REQ-003, REQ-005 | T-004 |
| REQ-004, REQ-027, REQ-044, REQ-106, REQ-162 | T-002 |
| REQ-006 | T-025 |
| REQ-007, REQ-008, REQ-009 | T-006 |
| REQ-010 | T-005, T-006 |
| REQ-020, REQ-021, REQ-026 | T-007 |
| REQ-022, REQ-023, REQ-024, REQ-025, REQ-029, REQ-030, REQ-031 | T-014 |
| REQ-032 | T-006, T-012 |
| REQ-033 | T-024 |
| REQ-034 | T-001, T-024 |
| REQ-040, REQ-045, REQ-046 | T-010 |
| REQ-041, REQ-042, REQ-043 | T-013 |
| REQ-060, REQ-093, REQ-094 | T-008 |
| REQ-095 | T-008, T-015, T-016, T-017 |
| REQ-100, REQ-107 | T-015, T-017 |
| REQ-101, REQ-105 | T-016 |
| REQ-102 | T-016, T-017 |
| REQ-103 | T-020, T-023 |
| REQ-104 | T-015 |
| REQ-108 | T-017 |
| REQ-109 | T-020 |
| REQ-120, REQ-121, REQ-122, REQ-123, REQ-124, REQ-125 | T-026 |
| REQ-126, REQ-127 | T-011 |
| REQ-140, REQ-144 | T-009 |
| REQ-141, REQ-142, REQ-143 | T-018 |
| REQ-160, REQ-161, REQ-163 | T-001 |
| REQ-164 | T-028 |
| REQ-180 | T-019, T-020 |
| REQ-181 | T-022 |
| REQ-182 | T-021 |
| REQ-183, REQ-184 | T-029 |

## Deferred requirements

Requirements not yet implemented, with their target. Closes Analyze finding A-12. Rows leave the
table when their requirement is cited by a test: the catalog (Phases 1-3) and the Dashboard
composition (Phase 5, `0.2.0`, closed 2026-09-26) have left it.

| REQ | Priority | Target | Reason |
|---|---|---|---|
| REQ-028 | SHOULD | After v1 | `tonalMechanism: 'weight'` belongs to the `cyanotype` ground, which is not in v1 |
| REQ-047 | COULD | After v1 | The optional Tailwind preset is a convenience, not a dependency |

## Execution log

| Date | Tasks | Result | Notes |
|---|---|---|---|
| — | — | — | Not started |

If implementation reveals the spec was wrong: **stop, update the spec or open a Delta in
`changes/`, and only then continue.**
