# Implementation Plan and Tasks — Phase 7, catalog expansion

> Source specs: [`prd-delta.md`](prd-delta.md) (REQ-400..REQ-426, REQ-430..REQ-450) ·
> [`api-delta.md`](api-delta.md) · [`technical-design-delta.md`](technical-design-delta.md)
> DD-028..DD-036 · [`data-model-delta.md`](data-model-delta.md) §2.15..§2.24, §4–§6.
> Generated: 2026-10-08. Task ids continue the global sequence after T-163.

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 4, approved 2026-10-09 by Ernesto Crespo (Phase 1). First run T-164..T-167 |

**Goal.** A consumer draws distributions, comparisons, ranks, intervals, compositions, hierarchies,
fields and networks with silverpoint, in React, Vue or Angular, with the same exactness, parity,
determinism and accessibility as the first 33 charts.

**Done criteria (Phase 7, per wave)**
- Every MUST of the wave cited by a test; traceability 0 blocking (REQ-183, REQ-184).
- The wave's catalog rows green in the parity, pixel, mode-invariance and cross-engine gates.
- REQ-444's no-growth check and REQ-445's benchmarks green.
- Gallery page of the four example apps shows the wave; e2e (keyboard, hydration in Chromium,
  Firefox, WebKit) and axe green.
- Docs: gallery entry, generated props and the method statement per chart (REQ-449).
- Released from CI as the wave's minor (OQ-C1); deltas folded at the end of wave 3 (T-199).

**Carried rules.** Test-first; cite the REQ; mutation-check any test written after the code. A chart
is a catalog row (DD-034); every gate iterates the catalog. Gates that launch Chromium run alone.
Every change touching `packages/` adds a changeset. Statistic tests record the independent tool and
command that produced their reference values.

## Steps

| Step | Content | Tasks | Depends on | Exit |
|---|---|---|---|---|
| 7a | Core foundations: types, contracts, diagnostics, `shared/stats` and `shared/density`, `tree` keys, `ringTone` shared, demo generator | T-164..T-167 | Approval | Core unit + property tests, benchmarks green |
| 7b | **Wave 1** — 14 charts (REQ-400..REQ-413) | T-168..T-179 | 7a | `0.4.0` from CI |
| 7c | **Wave 2** — 8 charts (REQ-414..REQ-421), owned hierarchy layouts | T-180..T-189 | 7b released | `0.5.0` from CI |
| 7d | **Wave 3** — 5 charts (REQ-422..REQ-426), owned contour and triangulation | T-190..T-198 | 7c released | `0.6.0` from CI |
| 7e | Fold deltas into `specs/`, traceability, `CLAUDE.md` status | T-199 | 7d | Specs current |

**First run: T-164..T-167 only** (7a), then review before scaling.

## Tasks

### 7a — Core foundations

**[x] T-164 · Types, contracts, diagnostics and catalog scaffolding** — REQ-430, REQ-433, REQ-434, REQ-437, REQ-444, REQ-450
- Props types for the 27 charts (API delta §3) in `types/props.ts`, accessor JSDoc as REQ-099; a type
  test that `StrokePart`, `StrokePaint` and `LabelKind` are unchanged (REQ-450); data contracts §2.15..§2.24
  as types plus validators; `SP020`..`SP022` in `diagnostics/` with messages naming chart, property
  and REQ.
- Tests (RED first): each validator's drop/swap/warn rule from the Data Model delta; each code raised
  once per render with the first offending key.
- **Done:** tests green; mutation: accept a cycle → `SP020` test red.

**[x] T-165 · `charts/shared/stats.ts` and `density.ts`** — REQ-430, REQ-432, REQ-433, REQ-445 `[P]`
- `bins`, `quantile`, `fiveNumber`, `density` (Epanechnikov, 64 samples, Silverman with 6-digit
  rounding), `ecdf`, `rank` (DD-029).
- Tests: reference values from R/NumPy on the demos and on edge cases (n = 1, all ties, IQR = 0,
  negative values); property tests I-23, I-24; no `Math.exp`/`Math.random`/`Date.now` (lint).
- **Done:** tests green; 1 000-observation benchmark < 4 ms; mutation: type-6 quantile → red.

**[x] T-166 · `stepTree`, and `ringTone` for every family** — REQ-438, REQ-440, REQ-447 `[P]`
- `interaction/hit-test.ts`: `HitArea.node`, `stepTree` (DD-031); path announcement builder.
- Move `ringTone`/`ringTones` to `shared/cells.ts`, re-exported from `polar.ts` so no import changes
  (DD-032).
- Tests: every key × root/leaf/middle × first/last sibling; RTL leaves Left/Right meaning unchanged
  in the tree (documented, as APG trees do); `ringTone` keeps neighbours distinct for 2..60
  categories; **every existing canonical unchanged** by the move.
- **Done:** tests green; existing `stepLinear`/`stepGrid` tests unchanged.

**[x] T-167 · `tools/demo-gen` and the 27 frozen demos** — REQ-446, REQ-093 `[P]`
- Private workspace package; one generator per Data Model delta §2 row, fixed seed, prints literals.
- Tests: every demo deep-frozen (I-9); regenerating reproduces the committed literals byte for byte.
- **Done:** tests green. **7a closed.**

**7a ledger (Phase 1, 2026-10-09).** Done: T-164..T-167, test-first, mutation-checked as listed.
Where the work differed from the letter of the tasks, and why:
- **`charts/shared/contracts.ts`** holds every reader of Data Model §2.15..§2.24 (with `SP020`'s
  hierarchy validation), the `SP021` parameter checks, `warnTooSmall` (`SP022`) and the REQ-443
  ceilings, so T-180 and T-190 build their layouts on it rather than re-validating. A reader raises
  `SP002` **once per render**, naming the first offending property and row, as T-164 asks.
- **Whisker ends are clamped to the quartiles** (`fiveNumber`): with type-7 quartiles the last
  observation inside a fence can lie past the box, and I-24's property test found it.
- **Bins:** a count asks for exactly that many equal bins over the extent niced to the 1-2-5
  ladder; thresholds are edges, closed by the data's extent (so I-24 holds); steps are exact
  decimals built without `Math.log10`; at most 1 000 bins, so a long tail cannot hang the core.
- **`no-transcendental`** (lint) covers the eight new `shared` modules and `contracts.ts`; it also
  forbids `**`. One reviewed allowance: `rootOf`, the single `Math.pow` of DD-029.
- **Benchmarks:** `packages/core/bench/stats.bench.ts`; `tools/bench-report` holds REQ-445's
  4 / 8 / 16 ms budgets (`stats ·`, `field ·`, `network ·`). Locally ≈ 0.3 ms per statistic.
- **Demos:** the hierarchy has 24 leaves at two depths, not 16 (Data Model delta §4 corrected); the
  `SP022` group is fixture-only (A-09). Datasets shared by several charts live in one demo and are
  re-exported. The grid and point-cloud demos are large (≈ 34 and 43 KB of source): measure their
  weight against the one-chart budget when wave 3 lands.

### 7b — Wave 1 (`0.4.0`)

Each recipe task: recipe in the anatomy of DD-036, drawn in the grammar of DD-035 (REQ-450), + its unit
tests (geometry, derived table and announcements, heighten, diagnostics, demo rule REQ-098) + its
catalog row. Review each against an existing recipe of the same engine (`bar-chart.ts`,
`step-chart.ts`, `donut-chart.ts`, `radar-chart.ts`, `heatmap-chart.ts`). Adapters come in T-177 for the whole wave.

**[x] T-168 · `HistogramChart`, `EcdfChart`** — REQ-400, REQ-401, REQ-431, REQ-441, REQ-442
**[x] T-169 · `BoxPlotChart`, `ViolinChart`** — REQ-402, REQ-403, REQ-434, REQ-431, REQ-441, REQ-442 `[P]`
**[x] T-170 · `RidgelineChart`** — REQ-404, REQ-440, REQ-442 `[P]`
**[x] T-171 · `BeeswarmChart` and `shared/beeswarm.ts`** — REQ-405, REQ-435, REQ-443 `[P]`
- Plus I-28; benchmark at 500 points.

**7b ledger, part 1 (Phase 2, 2026-10-09).** Done: T-168..T-171, the six distribution recipes,
test-first in `packages/core/test/wave1-distribution.test.ts` (the first catalog's contract applied
to each, plus each chart's own cases) and `beeswarm.test.ts`; one mutant per task caught.
- **Catalog rows move to T-177/T-178.** `tools/visual-gate/catalog.ts` is iterated by the
  adapter tests, the string and pixel gates, e2e and the docs: a row without its adapters turns
  them red. The recipes carry their contract in the core until their adapters land.
- **Not yet in the core barrel.** Measured (esbuild, min + gzip −9): the main entry is ≈ 47.6 KB
  today and ≈ 57.6 KB with these six; the 27 would add ≈ 40 KB. How the second catalog reaches
  the adapters without breaking the "core (everything)" budget is decided in Phase 4 (T-177).
- **Grammar.** Every heighten is the `StepChart` mark: a 3.5 px circle filled `heighten` plus its
  `ink` outline, at the derived point (modal bin top, median crossing, highest median, front peak);
  the beeswarm heightens its maximum point itself. Bins are `rectPath`, tone 2 (1 when cumulative,
  under an exact top line); boxes and violins tone 1; ridges outline only; medians `weight: 2`.
- **Keyboard.** Box plot: a grid, one stop per group and its outliers below it (Down); ECDF: a grid
  of step × group, so a second group is reachable; the rest linear, the beeswarm in value order.
- **Derived values stay exact.** `HitArea.value` and the frozen summary `datum` carry unrounded
  statistics; coordinates are rounded (REQ-002); the table formats both.
- **Shared bandwidth** (violin, ridgeline): the prop, else the mean of the groups' Silverman rules;
  the description names which. ECDF: past two groups the rest are not drawn (`SP002`).
- **Beeswarm:** a swarm taller than its band is repacked at 0.8 × the radius (at most 8 times, not
  below 1 px), so points never overlap; candidates are tried smallest-first, first fit wins
  (500 points ≈ 1.8 ms; the first version was O(n³), 124 ms).
**[x] T-172 · `LollipopChart`, `DumbbellChart`, `SlopeChart`** — REQ-406, REQ-407, REQ-408, REQ-441 `[P]`
- Arrow end marker exact (encoding); direction stated in the table and announcement, not by shape alone.
**[x] T-173 · `BumpChart`** — REQ-409, REQ-432, REQ-440 `[P]`
**[x] T-174 · `ErrorBarChart`, `IntervalChart`** — REQ-410, REQ-411, REQ-443 `[P]`
- Interval on a date axis: UTC only; test in a non-UTC `TZ` produces the same model.
**[x] T-175 · `DivergingBarChart`** — REQ-412, REQ-440 `[P]`
**[x] T-176 · `ConnectedScatterChart`** — REQ-413 `[P]`

**7b ledger, part 2 (Phase 3, 2026-10-09).** Done: T-172..T-176, eight recipes, test-first in
`packages/core/test/wave1-comparison.test.ts`; the second catalog's contract now lives in
`test/support/second-catalog-contract.ts`, shared by both wave-1 files. One mutant per task caught.
- **Orientation defaults.** `DumbbellChart` and `ErrorBarChart` default to `rows` (long category
  names, a forest plot's reading); `LollipopChart` keeps `BarChart`'s columns. Documented in the props.
- **Direction never by shape alone** (REQ-440): dumbbell and slope tables carry a signed `change`
  (`+4`, `−8`); the arrowhead is an exact closed path, toned like the dot it replaces.
- **Heighten** is the mark itself where the mark is closed (lollipop head, dumbbell end, error-bar
  estimate, interval pill, diverging segment), else the `StepChart` circle (slope end, bump leader,
  connected-scatter end).
- **Keyboard.** Dumbbell and slope: a grid of category × (start, end); bump: x × series; interval:
  lane × order; diverging: row × level. Zero shares have no segment and no stop.
- **Layout aids, labels only** (Art. 1: no encoding vertex moves): `spreadLabels` (shared/cartesian)
  spaces slope and bump end labels; `fitText` (shared/format) cuts long names with "…" in every
  new chart's label column and under lollipop columns, thinned to one per 48 px; the table and the
  readout keep the whole name.
- **Diverging axis** is symmetric about the centre, to the next 1-2-5 step: d3's `nice` turned
  ±55 % into ±100 %. Interval date ticks print ISO `MM-DD`, never through `Intl` dates (REQ-103).
- **I-23** (row order irrelevant) is held by the statistic charts; category charts draw in data
  order by design, as `BarChart` does, and are marked `ordered` in the contract.

**[x] T-177 · Wave 1 adapters ×3** — REQ-444, REQ-101, REQ-104, REQ-108
- One file per chart per adapter through the existing chart base; subpath exports; barrel entries.
- Tests: the adapter test suite iterates the catalog (existing); type tests for required props
  (`levels`, `groupKey` on ridgeline).
- **Done:** tests green; REQ-106 lint green.

**[x] T-178 · Wave 1 fixtures, gates and budgets** — REQ-448, REQ-435, REQ-441, REQ-444, REQ-445
- Fixtures generated from the catalog, **full matrix on every PR** (OQ-C4); canonicals; parity and pixel gates; mode invariance;
  **cross-engine determinism test** (TD delta §6) for every wave-1 chart; size-limit rows; benchmarks.
- **Done:** PR and nightly gates green; no existing canonical changed.

**7b ledger, part 3 (Phase 4, 2026-10-09).** Done: T-177, T-178. The 14 recipes reach the
adapters; 14 catalog rows; 756 fixtures (140 on PR), no existing canonical changed.
- **`@silverpoint/core/catalog`** (user decision 2026-10-09, of three: one subpath, per-chart core
  subpaths, a larger budget): the second catalog's recipes, apart from the main entry as
  `/dashboard-demos` and `/ui` are. `core (everything)` stays at 44.7 of 45 kB; the subpath has its
  own row (33.3 kB with wave 1, 45 kB budget, revisited with waves 2 and 3). Props types stay in the
  main entry.
- **REQ-444 no-growth** is a gate test against `tools/bundle-budget/one-chart-0.3.0.json`, measured
  on a v0.3.0 worktree build. It found the Phase 1 `stepTree` in every one-chart build (+156 B): the
  tree model now reaches `stepActive` as data, `HitArea.moves` (index per key), computed by
  `interaction/tree.ts` (`treeMoves`, `treeLabel`), which only hierarchy charts import. Every
  existing build is now within +65 B of 0.3.0. **Data Model delta:** `HitArea.moves` beside `node`,
  folded with T-199.
- **Required props.** `RidgelineChart.groupKey` and `DivergingBarChart.levels` are required in all
  three adapters (`input.required` in Angular, checked on the partial declaration); the catalog's
  `required` passes them to every fixture, adapter test and type test, as every use must.
- **`levels` and `axis` go with the data** (REQ-099): they say how the columns are read, so they
  are ignored with the demo like `…Key`; the `data` prop's documentation lists them.
- **Vue booleans** that default to `true` (`outliers`, `quartiles`, `percent`, `arrows`) and
  `cumulative` are declared `undefined` by default, as `SpDonutChart`'s `legend`: Vue's boolean
  casting would otherwise turn an absent prop into `false`.
- **REQ-124 identity:** `DivergingBarChart` tones its levels; its channel is the legend naming every
  level, and the side states the sign.
- **Dataset families.** The demo leak check treats charts that re-export one dataset (histogram ·
  ECDF · beeswarm; box · violin · ridgeline; dumbbell · slope) as one family.
- **Benchmarks (REQ-445).** Histogram, box, violin and ridgeline over 1 000 observations against
  4 ms (`stats · …`); the ECDF and the beeswarm draw a mark per observation, so they are timed as
  point charts, at 100 against 2 ms, and their statistics alone (ECDF of 1 000, packing of 500)
  against 4 ms. The ECDF table is now built in one pass (it was quadratic), and a table with a row per
  observation resolves its formatter once (`numberFormatter`, same output as `formatNumber`).
- **Cross-engine determinism** (TD delta §6): `e2e/determinism.spec.ts` compares the core's SVG
  string for every second-catalog fixture (cream, ink and precision) in Chromium, Firefox and
  WebKit with Node's, byte for byte; the canonical page exposes the string as `spCanonical`.
- **Docs and apps reached in this phase only as far as the gates need:** each app's chart map and
  the docs site's chart list (the e2e gallery and docs counts iterate the catalog). The gallery page,
  the docs prose, the READMEs and the release are T-179.

**[ ] T-179 · Wave 1 example apps, docs, changeset** — REQ-449, REQ-103, REQ-109, REQ-122
- Gallery page in the four apps; e2e: keyboard traversal per chart, hydration in Chromium, Firefox and
  WebKit (beeswarm and violin specifically), axe. Docs gallery + generated props + method statement.
- `minor` changeset; release steps of `CLAUDE.md`.
- **Done:** `0.4.0` on npm, verified against the registry.

**7b ledger, part 4 (Phase 5, 2026-10-09).** T-179 done but for its release, which waits for the
user's word (CLAUDE.md): the box stays open until `0.4.0` is on npm.
- **Gallery.** Each app's `?gallery` iterates the fixtures, so it already draws the 47; the axe,
  table and keyboard e2e (`a11y.spec.ts`) iterate them too: every new chart is Tab-reachable, its
  arrows traverse it and announce each item as the core's `readout` says.
- **Hydration** (`e2e/hydration.spec.ts`): in each server-rendered app, every new chart's server
  HTML is the canonical render and hydrates with no mismatch; the beeswarm and the violin also in
  Firefox and WebKit. The Vue app renders fixture pages on the client, so `prerender.mjs` now writes
  the 14 second-catalog fixture pages to `dist/ssr/<id>.html`, which `main.ts` hydrates.
- **Docs.** The gallery and the props reference come from the catalog (Phase 4); REQ-449's method
  statements live in `docs/site/src/methods.ts`, one per derived value, printed under "How it is
  computed" on each chart page, held to the catalog by `methods.test.ts`.
- **READMEs** list the 47 charts (a test now holds each adapter's to the catalog) and name the
  required props; the core's names `@silverpoint/core/catalog`.

### 7c — Wave 2 (`0.5.0`)

**[ ] T-180 · `shared/hierarchy.ts`: stratify, squarify, partition, tidy tree** — REQ-437, REQ-430, REQ-444
- All owned (DD-028). `stratify` + validation (`SP020`), `reroot` (DD-033), squarify (Bruls et al.),
  partition, Buchheim tidy tree.
- Tests (RED first): every invalid case of the Data Model delta §2.23; I-25 on the demo; hand-computed
  tidy-tree layouts (unbalanced, chain, fan-out); squarify tiles disjoint and covering; forbidden-maths
  lint green.
- **Done:** tests green; benchmark 500 nodes < 4 ms; mutation: skip the apportion step of the tidy
  tree → overlap test red.

**[ ] T-181 · `SquarifiedTreemap`** — REQ-416, REQ-438, REQ-439, REQ-440
**[ ] T-182 · `SunburstChart`** — REQ-417, REQ-438, REQ-439, REQ-440 `[P]`
**[ ] T-183 · `TreeChart`** — REQ-418, REQ-438 `[P]`
**[ ] T-184 · `WaffleChart`, `MarimekkoChart`** — REQ-414, REQ-415, REQ-440 `[P]`
- I-26; waffle heighten emitted as one `<path>` (I-4).
**[ ] T-185 · `ParallelCoordinatesChart`** — REQ-419, REQ-097 `[P]`
**[ ] T-186 · `PolarLineChart`, `PolarScatterChart`** — REQ-420, REQ-421, REQ-443 `[P]`

**[ ] T-187 · Wave 2 adapters ×3, `onRootChange`** — REQ-439, REQ-444, REQ-108
- Tests: activation emits the node id; the centre emits the parent; Vue component holds no root ref
  (I-30); server render with `rootId` equals the client render.

**[ ] T-188 · Wave 2 fixtures, gates and budgets** — REQ-448, REQ-444, REQ-445
- Plus the two `rootId` state fixtures.

**[ ] T-189 · Wave 2 example apps, docs, changeset** — REQ-449, REQ-438
- e2e: tree keyboard on treemap, sunburst and tree with a screen-reader announcement check. `0.5.0`.

### 7d — Wave 3 (`0.6.0`)

**[ ] T-190 · `shared/field.ts` and `shared/delaunay.ts`** — REQ-430, REQ-435, REQ-444
- All owned (DD-028). Grid validation (Data Model delta §2.24), Epanechnikov density splat, marching
  squares with saddle resolution and band rings; Bowyer–Watson on the 2-decimal grid with exact
  `orient2d` and a `BigInt` fallback for `inCircle`; Voronoi by clipping.
- Tests: iso-line vertices on cell edges; filled bands' areas sum to the plot area minus holes;
  empty-circumcircle property on every triangle (exact predicate) for random, grid-aligned,
  collinear and duplicate points; cross-engine determinism.
- **Done:** tests green; 60 × 60 grid < 8 ms; 500-point triangulation < 8 ms.

**[ ] T-191 · `DensityBinChart` and `shared/field.ts` (2-D bins)** — REQ-422, REQ-443
**[ ] T-192 · `ContourChart`** — REQ-423, REQ-445, REQ-447 `[P]`
**[ ] T-193 · `DelaunayChart`** — REQ-424 `[P]` (COULD — OQ-C5)
**[ ] T-194 · `VectorFieldChart`** — REQ-425 `[P]` (COULD — OQ-C5)
**[ ] T-195 · `NetworkChart` and `shared/network.ts`** — REQ-426, REQ-435, REQ-436, REQ-445
- Benchmark at 150 nodes / 300 iterations **first**; if over 16 ms, settle the default `iterations`
  before the recipe (DD-030).
**[ ] T-196 · Wave 3 adapters ×3** — REQ-444
**[ ] T-197 · Wave 3 fixtures, gates and budgets** — REQ-448, REQ-435, REQ-445
- Plus the consumer-positions network fixture.
**[ ] T-198 · Wave 3 example apps, docs, changeset** — REQ-449. `0.6.0`.

### 7e — Close

**[ ] T-199 · Fold, traceability, status** — REQ-183, REQ-184
- Fold the five deltas and the constitution amendment into `specs/`; `reports/traceability.md`;
  `CLAUDE.md` status table and "Where things stand".

## Traceability

| REQ | Tasks |
|---|---|
| REQ-400, REQ-401 | T-168 |
| REQ-402, REQ-403 | T-169 |
| REQ-404 | T-170 |
| REQ-405 | T-171 |
| REQ-406..REQ-408 | T-172 |
| REQ-409 | T-173 |
| REQ-410, REQ-411 | T-174 |
| REQ-412 | T-175 |
| REQ-413 | T-176 |
| REQ-414, REQ-415 | T-184 |
| REQ-416 | T-181 |
| REQ-417 | T-182 |
| REQ-418 | T-183 |
| REQ-419 | T-185 |
| REQ-420, REQ-421 | T-186 |
| REQ-422 | T-191 |
| REQ-423 | T-192 |
| REQ-424 | T-193 |
| REQ-425 | T-194 |
| REQ-426 | T-195 |
| REQ-430 | T-164, T-165, T-180, T-190 |
| REQ-431 | T-168, T-169 (and every recipe's table test) |
| REQ-432 | T-165, T-173 |
| REQ-433 | T-164, T-165 |
| REQ-434 | T-164, T-169 |
| REQ-435 | T-171, T-178, T-195, T-197 |
| REQ-436 | T-195 |
| REQ-437 | T-164, T-180 |
| REQ-438 | T-166, T-181..T-183, T-189 |
| REQ-439 | T-181, T-182, T-187 |
| REQ-440 | T-166, T-170, T-173, T-175, T-181, T-182, T-184 |
| REQ-441 | T-168, T-169, T-172, T-178 |
| REQ-442 | T-168..T-170 (and every recipe's heighten test) |
| REQ-443 | T-171, T-174, T-186, T-191 |
| REQ-444 | T-164, T-177, T-178, T-180, T-187, T-188, T-190, T-196 |
| REQ-445 | T-165, T-178, T-188, T-192, T-195, T-197 |
| REQ-446 | T-167 |
| REQ-447 | T-166, T-192 |
| REQ-448 | T-178, T-188, T-197 |
| REQ-449 | T-179, T-189, T-198 |
| REQ-450 | T-164, T-168..T-176, T-181..T-186, T-191..T-195, T-178, T-188, T-197 |

## Constitution check

- **Art. 9** — every task cites its REQ; every MUST maps to a task above; the first run is four
  tasks, reviewed before the waves start.
- **Art. 3** — each wave goes through the gates before its release; T-178/T-188/T-197 also prove
  no existing canonical moved.
- **Art. 8** — no dependency enters (DD-028); T-180 and T-190 own the subtle algorithms, and the
  no-growth check of T-178/T-188/T-197 proves they tree-shake.
