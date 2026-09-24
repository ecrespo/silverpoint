# Tasks — Phase 1, layout engine

> Source specs: [PRD](../specs/prd.md) v1.7 · [API Spec](../specs/api-spec.md) v1.5 ·
> [Technical Design](../specs/technical-design.md) v1.4 · [Data Model](../specs/data-model.md) v1.3 ·
> [Implementation Plan](../specs/implementation-plan.md) v1.3, Phase 1
> Generated: 2026-09-24, as Phase 0 closed. `specs/` is read-only in this checkout, so the phase's
> tasks live here and are folded into `specs/tasks.md` when it is writable.

**Goal.** The six charts that need no scale — bullet, pyramid, treemap, density heatmap, sankey,
activity grid — in all three adapters, with their fixtures in the matrix.

**Done criteria (Implementation Plan, Phase 1)**
- All 6 in all three adapters, with their fixtures in the matrix.
- Path weight measured for the matrix families, where the tile helps least.
- Tabular alternative and keyboard navigation on all 6.
- Each chart reviewed against REQ-124: no information carried by hatch style alone.

**Design constraint carried from Phase 0.** `precision` mode draws no hatching at all
(REQ-021), so every chart that encodes a value as tone must carry it through a second,
non-hatch channel as well — a label, a length, or a size. This is how REQ-124 is met and
how each chart stays legible with hatching disabled.

Conventions as in `specs/tasks.md`: `[P]` parallelisable, every task and test cites its REQ.
Task ids continue the global sequence from T-030.

## Tasks

### Shared infrastructure

**[ ] T-030 · Chart shell and box hit areas**
- **What**: extract the shared model scaffolding of the line chart — accessible name, ids,
  deferred render, card layout, empty state — into `charts/shared/shell.ts`, with no change to
  the line chart's output; `HitArea` gains an optional `box`, and `resolveActive` prefers the
  box containing the pointer before falling back to proximity.
- **REQ**: REQ-007, REQ-009, REQ-094, REQ-120, REQ-140
- **Files**: `packages/core/src/charts/shared/`, `packages/core/src/interaction/`
- **Done**: the line-chart snapshot and all eight canonical renders are unchanged; a pointer
  inside a box resolves to that box's item even when another centre is nearer.

**[ ] T-031 · Deterministic PRNG and UTC date helpers** `[P]`
- **What**: a seeded 32-bit PRNG and ISO-date arithmetic in UTC, for the activity grid's demo.
- **REQ**: REQ-004, REQ-005
- **Files**: `packages/core/src/render/prng.ts`, `packages/core/src/charts/shared/dates.ts`
- **Done**: the same seed yields the same sequence; date arithmetic never depends on the host
  time zone; no `Math.random`, `Date.now` or argument-less `new Date()`.

### Recipes

**[ ] T-032 · `BulletChart` recipe**
- **What**: one row per target — a bar to `actual` and a marker at `target`, both on 0-100;
  out-of-range values clamp and warn; demo dataset.
- **REQ**: REQ-069, REQ-093, REQ-095, REQ-121, REQ-124
- **Depends on**: T-030
- **Done**: the bar length and the marker position encode the data; a snapshot of the demo.

**[ ] T-033 · `PyramidChart` recipe** `[P]`
- **What**: stacked, centred tiers whose width encodes `width`; optional `toneKey`; a
  non-monotonic series is drawn anyway and warned.
- **REQ**: REQ-070, REQ-093, REQ-121, REQ-124
- **Depends on**: T-030

**[ ] T-034 · `HeatmapChart` recipe** `[P]`
- **What**: labelled rows × value cells; the value normalised to `scaleMax` (default 100) sets the
  tone, and every cell also prints its value; rows of unequal length use the shortest, and warn.
- **REQ**: REQ-084, REQ-093, REQ-121, REQ-124
- **Depends on**: T-030

**[ ] T-035 · `TreemapChart` recipe** `[P]`
- **What**: tiles of `cols × rows` cells placed first-fit, row-major, in a `columns × rows`
  grid; a label and a share on every tile; tiles that overflow the grid are dropped and warned.
- **REQ**: REQ-085, REQ-093, REQ-121, REQ-124
- **Depends on**: T-030

**[ ] T-036 · `SankeyChart` recipe** `[P]`
- **What**: nodes layered by longest path, heights and band widths proportional to flow; a flow
  that would close a cycle, or a non-positive value, is dropped and warned. The flow total is
  derived from the data present, and the derivation is documented.
- **REQ**: REQ-086, REQ-093, REQ-097, REQ-121, REQ-124
- **Depends on**: T-030

**[ ] T-037 · `ActivityGrid` recipe** `[P]`
- **What**: one cell per day, weeks as columns; the consumer's `level` sets both the tone and the
  cell's size; a length that is not a multiple of 7 is trimmed and warned. The demo dataset is
  generated with a fixed seed and ends on the constant 2026-06-30 (Data Model §4).
- **REQ**: REQ-087, REQ-093, REQ-005, REQ-121, REQ-124
- **Depends on**: T-030, T-031

### Adapters

**[ ] T-038 · Generic chart plumbing in every adapter**
- **What**: React `createClientChart` / `createServerChart`, Vue `useChart` + a shared shell
  component, Angular `SpChart` base directive; the line chart moves onto them with no change to
  its markup.
- **REQ**: REQ-100, REQ-102
- **Depends on**: T-030
- **Done**: every adapter test and the string gate stay green, unchanged.

**[ ] T-039 · React components and subpaths**
- **What**: the six charts as client components and server variants, each at its own subpath.
- **REQ**: REQ-100, REQ-104, REQ-107
- **Depends on**: T-032 … T-038

**[ ] T-040 · Vue components and subpaths** `[P]`
- **What**: `SpBulletChart` … `SpActivityGrid` with typed props and emits, each at its subpath.
- **REQ**: REQ-100, REQ-107, REQ-108
- **Depends on**: T-032 … T-038

**[ ] T-041 · Angular components and secondary entry points** `[P]`
- **What**: `sp-bullet-chart` … `sp-activity-grid`, standalone and OnPush with signal inputs, each
  a secondary entry point.
- **REQ**: REQ-100, REQ-101, REQ-105, REQ-107
- **Depends on**: T-032 … T-038

### Gates

**[ ] T-042 · Fixtures and the string gate across seven charts**
- **What**: 48 new fixtures (6 charts × 2 modes × 4 substrates, `md`) with committed canonical
  renders; the string gate over 3 adapters × 56 fixtures.
- **REQ**: REQ-100, REQ-180, REQ-182
- **Depends on**: T-039, T-040, T-041

**[ ] T-043 · Example apps and pixel gate over the new fixtures**
- **What**: every example app renders any fixture's chart; golden images for the 48 new fixtures,
  generated in the pinned image.
- **REQ**: REQ-181, REQ-182
- **Depends on**: T-042

**[ ] T-044 · Path weight of the matrix families** ⟵ *the open question of TD §10*
- **What**: measure the heatmap and the activity grid — many small shapes — with `tile` and
  `per-shape`, at every size.
- **REQ**: REQ-029 · PRD NFR §7
- **Depends on**: T-034, T-037
- **Done**: the 40 KB budget is confirmed or corrected with data.

**[ ] T-045 · Keyboard and tabular alternative on all six**
- **What**: e2e keyboard traversal and table checks per chart, and axe-core over a gallery page
  showing all seven charts, in the four apps.
- **REQ**: REQ-120, REQ-121, REQ-122
- **Depends on**: T-043

**[ ] T-046 · REQ-124 review of the six charts**
- **What**: a written review per chart of every visual channel, and a test per chart that the
  data survives `precision` mode through a non-hatch channel.
- **REQ**: REQ-124, REQ-006
- **Depends on**: T-032 … T-037

**[ ] T-047 · Budgets, equivalence list and traceability**
- **What**: per-chart bundle budgets, the six charts added to the ink/precision equivalence
  list, the traceability report re-run.
- **REQ**: REQ-006, REQ-164, REQ-183
- **Depends on**: T-039 … T-041

## Out of Phase 1

REQ-096 (data-volume ceilings, `SP008`) stays in Phase 2 as the Deferred table says. The
candlestick half of REQ-097 stays in Phase 2; its sankey half lands in T-036.
