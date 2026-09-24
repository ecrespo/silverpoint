# Phase 2 — execution ledger

Tasks: `changes/phase-2-tasks.md` (T-048..T-070). Every task test-first; tests cite REQs.

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-048 | done | 6fcd55a | `charts/shared/cartesian.ts` (plot, value axis, category axis and labels, series reading); line chart moved onto it under unchanged tests: core 215/215, 8 canonicals unchanged |
| T-049 | done | 6fcd55a | `checkVolume` + `test/cartesian.test.ts` (RED 501 points → GREEN); every Phase 2 recipe calls it, and the contract test will cover all |
| T-051..T-064 | done | da03921 | contract over 14 recipes (15 tests each; RED 210/210 on stubs → green), `phase2-charts.test.ts` (38 specific; RED 37 → green), SP008 contract for all 14 (mutation-checked), demo snapshots (mutation-checked); core 479, grounds equivalence 86/86 |
| T-070 (part) | done | da03921 | the 14 appended to `grounds/test/equivalence.test.ts` |
| T-065 | done | 5821608 | 14 catalog rows turned the adapter suites RED (380 failures) → 639/639 green; React client + server, Vue SFCs, Angular secondary entries; typecheck, build, lint clean |
| T-066 | done | a38e581 | fixture test RED on 21 charts × 8 → CARDS + canonicals for 168 fixtures; string gate 504 comparisons, 0 failures; gates 180/180 — the extended tree-shaking gate went RED (84/84: scatter and bubble demos in every one-chart bundle) → GREEN with a literal recipe `name`; unit 1672/1672 |
| T-050 | done | (this commit) | `core/bench/hundred-points.ts` (15 cartesian recipes × 100 points; test RED on missing module → 16/16, mutation-checked: 99 points and a NaN both fail) + `geometry.bench.ts` (Vitest 5 `bench` fixture); first run put 5 charts over 2 ms (candlestick 3.8) — `Intl.NumberFormat` construction was 70–90 % of build time; `format.test.ts` RED (100 formatters) → cached formatters → worst mean 0.74 ms; `tools/bench-report` (3 tests, RED → green), `.github/workflows/nightly.yml`; unit 1693/1693, gates 180/180 |

## Rulings

- **Phase 2 · Ruling:** the spec gives each chart's name, family and own props only (API Spec §7);
  the geometry of each is decided here, one ruling per chart, against the constitution and the
  REQ-124 second-channel rule carried from Phase 1.
- **T-051..T-064 · Ruling — geometry per chart** (spec gives names and props only):
  - `StepChart`: d3's exact `curveStepAfter` / `curveStepBefore` / `curveStep`; one heightened last point.
  - `SparklineRows`: rows of `{name, readout?, points[]}` per API Spec §7 (delta-008 proposes the
    Data Model entry); each row scales to its own range — the printed readout carries the value,
    the line the shape; `rows` caps rows from the first; one hit area per row (its band).
  - `KpiCard`: the figure is the card's value line (`value` prop, else the latest value), `metric`
    names it in the unit line; the delta sits at the top of the drawing area, printed signed, with
    a filled triangle pointing up / down / right (`deltaTone` overrides the sign); area sparkline.
  - `BarChart`: stadium "pill" bars (arcs at both ends), band padding 0.3; a secondary series sits
    beside the first, dotted, with a legend; `rows` puts categories down the left.
  - `StackedBarChart`: tones 1-4 by key, bottom to top; a legend names the keys in stack order;
    negatives cannot stack and are drawn at zero with SP002.
  - `ComposedChart`: plain rectangles (not pills) under a monotone spline, one scale, a legend.
  - `WaterfallChart`: `base` rows are totals from zero that reset the running total; `delta` rows
    float; tones differ (total 3, rise 1, fall 2) but every bar prints its value signed or plain;
    dotted connectors are ornament.
  - `FunnelChart`: stages centred, width ∝ value / largest; value and share of the entry printed.
  - `CandlestickChart`: rising = hollow outline, falling = solid fill; wick one vertical line; time
    as even bands; `bounds` pins the scale exactly (no nicing), else low/high are niced; SP009 is
    thrown only when rows exist and none is valid and no `bounds` — an empty `data` is REQ-007's
    empty state, not an error.
  - `AreaChart`: toned closed area to zero under its exact line, heightened last point.
  - `RangeBandChart`: toned band with both edges exact (high solid, low dotted); not forced to zero.
  - `StreamChart`: exactly two waves (extra keys warned), second dotted and secondary ink; stacked
    rides on the first; a legend.
  - `ScatterChart` / `BubbleChart`: marker **area** affine in size across `sizeRange` (px²);
    scatter without `sizeKey` uses the smallest area; bubbles toned and drawn largest first; the
    scales run inside the plot by the largest radius so nothing clips.
  - Cost if wrong: a layout change, which moves demo output (never a patch).
- **T-051..T-064 · Ruling — keyboard:** charts of two or more series (bars with a secondary,
  stacked, composed, range band, stream) and the waterfall give every hit a grid `cell`
  (column = x, row = series); on a grid Home/End now reach the start/end of the current **row**,
  like a spreadsheet — which also refines Phase 1's grid charts. The line chart keeps its Phase 0
  series traversal — cost if wrong: one convention to unify in Phase 4.
- **T-065 · Ruling:** Vue casts an absent boolean prop to `false`, which silently turned
  `showLine` off; boolean own props (`showLine`, `stacked`) declare an explicit `undefined`
  default through `withDefaults`, so the core applies its own default. `connectNulls` (line chart)
  has the same cast but its core default is `false`, so it is left as is — cost if wrong: none.
- **T-065 · Ruling:** the catalog's `PHASE_1` list is renamed `AFTER_LINE_CHART` (every chart but
  the line chart), since the adapter suites, fixtures and path weight iterate it for all phases.
- **T-066 · Ruling:** a recipe's `name` is a string literal, never a read of a module constant
  (`FAMILY.chart`): a property read inside a `/* @__PURE__ */` call's argument counts as a possible
  side effect, so rolldown kept the argument — and with it the demo dataset — in every consumer's
  bundle. The tree-shaking gate over all 21 charts catches the regression — cost if wrong: none.
- **T-066 · Ruling (T-070 pulled forward):** the catalog-wide "core (everything)" alarm rises
  30 → 40 kB (measured 31.2 kB with 21 recipes), per the T-038 ruling that it grows with the
  catalog; the product budget stays per chart — cost if wrong: a looser catalog-wide alarm.
- **T-050 · Ruling:** Vitest 5 replaced module-scope `bench()` and `--outputJson` with a
  test-context `bench` fixture and the JSON reporter; the benchmark and the nightly job use those.
  The report reads the JSON reporter's `benchmarks` field — cost if wrong: a report to re-point.
- **T-050 · Ruling:** `formatNumber` keeps one `Intl.NumberFormat` per locale and options (a
  bounded, 64-entry module cache). Output is unchanged — every canonical and the string gate
  agree — and it is not render-path state that Art. 4 forbids: it holds no time or chance, only
  a pure function's memo — cost if wrong: one allocation per label again.
