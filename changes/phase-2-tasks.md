# Tasks — Phase 2, cartesian scale engine

> Source specs: [PRD](../specs/prd.md) v1.7 §6.4, NFR §7 · [API Spec](../specs/api-spec.md) v1.5 §5.1, §7,
> §11, §12 · [Data Model](../specs/data-model.md) v1.3 §2.1, §2.6 · [Technical Design](../specs/technical-design.md)
> v1.4 §5.1 · [Implementation Plan](../specs/implementation-plan.md) v1.3, Phase 2.
> Generated: 2026-09-24, as Phase 1 closed. `specs/` is read-only in this checkout, so the phase's
> tasks live here. Task ids continue the global sequence from T-048.

**Goal.** The 15 cartesian charts: the line chart from Phase 0 and 14 new recipes over one scale
engine and one family of path generators, in all three adapters.

**Done criteria (Implementation Plan, Phase 2)**
- All 15 with fixtures and `ink`/`precision` vertex equivalence verified.
- Candlestick with its `low ≤ min(open, close) ≤ max(open, close) ≤ high` invariant tested.
- The 500-point-per-series ceiling verified, with `SP008` actually emitted (REQ-096).
- Each chart reviewed against REQ-124.

**Carried from Phases 0-1.** A chart is a catalog row (`tools/visual-gate/catalog.ts`): recipe,
slug, REQ, props interface, consumer sample. Adapters are generated on the shared plumbing;
fixtures, the string gate, subpaths, tree-shaking and budgets iterate the catalog. Every tone is
backed by a non-hatch channel (REQ-124); `precision` draws no hatching.

**The 14 new charts** (API Spec §7 own props; Data Model §2.1 `CategorySeries` unless noted):

| REQ | Chart | Own props | Encoding |
|---|---|---|---|
| REQ-061 | `StepChart` | `xKey`, `valueKey`, `step: 'after' \| 'before' \| 'middle'` | step line |
| REQ-062 | `SparklineRows` | `rows`, `nameKey`, `readoutKey`, `seriesKey`, `pointKey` | one small line per row + printed readout |
| REQ-063 | `KpiCard` | `valueKey`, `metric`, `delta`, `deltaTone` | big metric + area sparkline |
| REQ-064 | `BarChart` | `xKey`, `valueKey`, `secondaryKey?`, `orientation` | pill bars, columns or rows |
| REQ-065 | `StackedBarChart` | `xKey`, `keys`, `names?` | stacked segments, one tone per key |
| REQ-066 | `ComposedChart` | `xKey`, `barKey`, `lineKey`, `showLine` | columns + spline |
| REQ-067 | `WaterfallChart` | `stepKey`, `baseKey`, `deltaKey` | floating deltas |
| REQ-068 | `FunnelChart` | `stageKey`, `valueKey` | horizontal stages |
| REQ-071 | `CandlestickChart` | `timeKey`, `openKey`, `highKey`, `lowKey`, `closeKey`, `bounds?` | OHLC bodies + wicks (§2.6) |
| REQ-072 | `AreaChart` | `xKey`, `valueKey`, `curve` | curved area, toned |
| REQ-073 | `RangeBandChart` | `xKey`, `lowKey`, `highKey` | band between two curves |
| REQ-074 | `StreamChart` | `xKey`, `keys`, `stacked` | two waves, overlaid or stacked |
| REQ-082 | `ScatterChart` | `xKey`, `yKey`, `sizeKey?`, `sizeRange` | points, optional size |
| REQ-083 | `BubbleChart` | `xKey`, `yKey`, `sizeKey`, `sizeRange` | circle area ∝ size |

## Tasks

### Shared engine

**[ ] T-048 · Cartesian frame**
- **What**: extract from the line chart the cartesian scaffolding — plot inset, axis band, value
  scale with ticks and grid, category or numeric x positions, category labels thinned to fit — into
  `charts/shared/cartesian.ts`, with no change to the line chart's output; add a horizontal
  (rows) orientation for bars and funnels.
- **REQ**: REQ-060, REQ-010, REQ-093
- **Done**: the line-chart snapshot and its eight canonical renders are unchanged.

**[ ] T-049 · Data-volume ceiling** `[P]`
- **What**: a series above 500 points warns `SP008` once, recommending aggregation, and is drawn
  in full (no silent degradation).
- **REQ**: REQ-096 · API Spec §12
- **Done**: `SP008` emitted by a 501-point series in every cartesian recipe, not by 500.

**[ ] T-050 · Geometry benchmark** `[P]`
- **What**: a Vitest benchmark of 100-point geometry per cartesian recipe, run nightly.
- **REQ**: PRD NFR Performance (< 2 ms) · TD §2
- **Done**: the benchmark runs; its budget is recorded in the report, not enforced on PR runners.

### Recipes — line family

**[ ] T-051 · `StepChart`** — `step` after / before / middle; the step vertices are exact.
REQ-061, REQ-093. Depends on T-048.

**[ ] T-052 · `SparklineRows`** `[P]` — one row per series: name, a sparkline on a shared x, and a
printed readout (the last value, or `readoutKey`). REQ-062, REQ-124.

**[ ] T-053 · `KpiCard`** `[P]` — the metric printed large, a signed delta printed with its tone,
and an area sparkline of `valueKey`. REQ-063, REQ-124.

### Recipes — bar family

**[ ] T-054 · `BarChart`** — pill bars (rounded ends), columns or rows, optional secondary series
side by side; zero baseline always in the domain. REQ-064.

**[ ] T-055 · `StackedBarChart`** `[P]` — one segment per key, stacked from zero; tone by key and
a legend, so tone never carries the key alone. REQ-065, REQ-124.

**[ ] T-056 · `ComposedChart`** `[P]` — columns of `barKey` and a spline of `lineKey` on one value
scale; `showLine: false` omits the line. REQ-066.

**[ ] T-057 · `WaterfallChart`** `[P]` — floating bars from a running base; rises and falls told
apart by position and a printed signed delta, not by tone alone. REQ-067, REQ-124.

**[ ] T-058 · `FunnelChart`** `[P]` — horizontal centred stages, width ∝ value, the value and the
share of the first stage printed. REQ-068.

**[ ] T-059 · `CandlestickChart`** `[P]` — bodies from open to close and wicks from low to high;
rows breaking `low ≤ min(open, close) ≤ max(open, close) ≤ high` are dropped with `SP002`; bounds
derived from the data unless `bounds` is given; an empty set without `bounds` throws `SP009`. Up and
down candles differ by fill (hollow / solid), not by hatch. REQ-071, REQ-097, REQ-124.

### Recipes — area and point families

**[ ] T-060 · `AreaChart`** — curved area with its top line; the fill is a tone over a
non-hatch line. REQ-072.

**[ ] T-061 · `RangeBandChart`** `[P]` — the band between low and high; rows with `low > high` are
swapped and warned `SP002` (Data Model §2.1). REQ-073.

**[ ] T-062 · `StreamChart`** `[P]` — two waves, overlaid, or stacked when `stacked`; told apart by
line and dash, like the line chart. REQ-074, REQ-124.

**[ ] T-063 · `ScatterChart`** `[P]` — points on two linear scales; `sizeKey` maps to area in
`sizeRange`; duplicate x allowed. REQ-082.

**[ ] T-064 · `BubbleChart`** `[P]` — circles whose **area** is proportional to `sizeKey`, in
`sizeRange`, largest drawn first. REQ-083.

### Adapters

**[ ] T-065 · The 14 charts in React, Vue and Angular**
- **What**: client and server React components, Vue SFCs, Angular secondary entry points, each
  at its subpath, generated on the shared plumbing; catalog rows with consumer samples.
- **REQ**: REQ-100, REQ-101, REQ-104, REQ-105, REQ-107, REQ-108

### Gates

**[ ] T-066 · Fixtures and the string gate across 21 charts** — 112 new fixtures; 3 adapters × 168
fixtures. REQ-100, REQ-180, REQ-182.

**[ ] T-067 · Example apps, gallery and pixel goldens** — the new charts in every app; goldens
generated in the pinned image and looked at. REQ-181.

**[ ] T-068 · Keyboard, tables and axe-core over all 21** — REQ-120, REQ-121, REQ-122.

**[ ] T-069 · REQ-124 review of the 14 charts** — a channel table per chart and a precision-mode
test each. REQ-124, REQ-006.

**[ ] T-070 · Equivalence, budgets, tree-shaking, traceability** — REQ-006, REQ-164, REQ-183.

## Out of Phase 2

The polar families, the coxcomb (REQ-088, a `CategorySeries` chart drawn on the arc engine), the
chord ring and the orbits are Phase 3.
