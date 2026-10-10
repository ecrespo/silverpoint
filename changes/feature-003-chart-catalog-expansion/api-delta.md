# API Spec delta — catalog expansion

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 2, approved 2026-10-09 by Ernesto Crespo (Phase 1); **folded into `specs/api-spec.md` (v1.10) on 2026-10-10** (T-199) |
| **Amends** | [API Spec](../../specs/api-spec.md) v1.9 → v1.10: §1, §5, new §7.3, §9, §10.1, §11, §12 |
| **Requirements** | REQ-400..REQ-426, REQ-430..REQ-450 ([`prd-delta.md`](prd-delta.md)) |

## 1. §1 Packages and entry points — amend

No new package and no new adapter subpath kind: every new chart is one more subpath of the same shape
as the existing 33 (REQ-107, REQ-444).

```ts
import { HistogramChart } from '@silverpoint/react/histogram-chart';
import { SpSunburstChart } from '@silverpoint/vue/sunburst-chart';
import { SpBoxPlotChart } from '@silverpoint/angular/box-plot-chart';
```

The `@silverpoint/core` dependency column is unchanged: the hierarchy, contour and triangulation
generators are owned by the core (DD-028), and no signature here depends on how they are built.

The statistics and layout functions are **internal** (§2): they are reached through the chart
recipes, not exported from the barrel. Exposing them (`@silverpoint/core/stats`) is OQ-C3.

## 2. §5 Common props — unchanged

All 27 accept `CommonChartProps`. The accessor rule holds: without `data`, accessor props are ignored
and every other own prop applies (REQ-098, REQ-099). For `NetworkChart`, `nodes` is data, so it is
ignored with the demo too.

## 3. New §7.3 — Catalog, second series

`Obs` = `Observations` (Data Model delta §2.15); other shapes as named there. **Heighten** is the one
element REQ-442 lets the chart heighten. **Keys** is the keyboard model: `linear` and `grid` are the
existing ones (`interaction/hit-test.ts`), `tree` is new (REQ-438).

### Wave 1 — distribution, comparison, change, ranking, uncertainty

| REQ | React | Vue | Angular selector | Own props | Data | Heighten | Keys |
|---|---|---|---|---|---|---|---|
| REQ-400 | `HistogramChart` | `SpHistogramChart` | `sp-histogram-chart` | `valueKey`, `bins?: number \| readonly number[]`, `cumulative?: boolean`, `orientation` | `Obs` | Modal bin (last bin when `cumulative`) | linear |
| REQ-401 | `EcdfChart` | `SpEcdfChart` | `sp-ecdf-chart` | `valueKey`, `groupKey?`, `markers?: readonly number[]` (quantiles drawn as rules) | `Obs` | Median crossing of the first group | linear |
| REQ-402 | `BoxPlotChart` | `SpBoxPlotChart` | `sp-box-plot-chart` | `valueKey`, `groupKey?`, `whisker?: number` (IQR multiple, 1.5), `outliers?: boolean`, `orientation` | `Obs` | Median of the group with the highest median | linear (one stop per group; outliers inside, by Down) |
| REQ-403 | `ViolinChart` | `SpViolinChart` | `sp-violin-chart` | `valueKey`, `groupKey?`, `bandwidth?: number`, `quartiles?: boolean`, `orientation` | `Obs` | Median mark of the group with the highest median | linear |
| REQ-404 | `RidgelineChart` | `SpRidgelineChart` | `sp-ridgeline-chart` | `valueKey`, `groupKey`, `bandwidth?`, `overlap?: number` (0–1, 0.5) | `Obs` | Peak of the front ridge | linear |
| REQ-405 | `BeeswarmChart` | `SpBeeswarmChart` | `sp-beeswarm-chart` | `valueKey`, `groupKey?`, `labelKey?`, `radius?: number` (3) | `Obs` | Maximum observation | linear (in value order) |
| REQ-406 | `LollipopChart` | `SpLollipopChart` | `sp-lollipop-chart` | `xKey`, `valueKey`, `orientation`, `sort?: 'none' \| 'ascending' \| 'descending'` | `CategorySeries` | Largest head | linear |
| REQ-407 | `DumbbellChart` | `SpDumbbellChart` | `sp-dumbbell-chart` | `labelKey`, `startKey`, `endKey`, `names?: [string, string]`, `endMarker?: 'dot' \| 'arrow'`, `orientation` | `Paired` | End mark of the largest change | linear (start, end per category) |
| REQ-408 | `SlopeChart` | `SpSlopeChart` | `sp-slope-chart` | `labelKey`, `startKey`, `endKey`, `names?: [string, string]` | `Paired` | Segment of the largest change | linear |
| REQ-409 | `BumpChart` | `SpBumpChart` | `sp-bump-chart` | `xKey`, `seriesKey`, `valueKey`, `order?: 'descending' \| 'ascending'` (rank 1 = highest by default), `series?: number` (cap) | `Ranked` | Last point of the rank-1 series | grid (series × x) |
| REQ-410 | `ErrorBarChart` | `SpErrorBarChart` | `sp-error-bar-chart` | `labelKey`, `estimateKey`, `lowKey`, `highKey`, `reference?: number`, `orientation` | `Estimates` | Estimate furthest from `reference` (or largest) | linear |
| REQ-411 | `IntervalChart` | `SpIntervalChart` | `sp-interval-chart` | `laneKey`, `startKey`, `endKey`, `labelKey?`, `axis?: 'number' \| 'date'` | `Intervals` | Longest interval | grid (lane × order) |
| REQ-412 | `DivergingBarChart` | `SpDivergingBarChart` | `sp-diverging-bar-chart` | `labelKey`, `levels: readonly string[]`, `neutral?: number \| null` (index; `null` = none), `percent?: boolean` (true) | `Likert` | Largest positive share | grid (row × level) |
| REQ-413 | `ConnectedScatterChart` | `SpConnectedScatterChart` | `sp-connected-scatter-chart` | `xKey`, `yKey`, `labelKey?`, `arrows?: boolean` | `PathPoints` | Last point | linear (path order) |

### Wave 2 — part-to-whole, hierarchy, multivariate, polar

| REQ | React | Vue | Angular selector | Own props | Data | Heighten | Keys |
|---|---|---|---|---|---|---|---|
| REQ-414 | `WaffleChart` | `SpWaffleChart` | `sp-waffle-chart` | `nameKey`, `valueKey`, `cells?: number` (100), `columns?: number` (10) | `SectorSeries` | The largest category's cells, emitted as **one** `<path>` (I-4 counts elements) | linear (one stop per category) |
| REQ-415 | `MarimekkoChart` | `SpMarimekkoChart` | `sp-marimekko-chart` | `columnKey`, `segmentKey`, `valueKey` | `Mosaic` | Largest cell | grid (column × segment) |
| REQ-416 | `SquarifiedTreemap` | `SpSquarifiedTreemap` | `sp-squarified-treemap` | `idKey`, `parentKey`, `valueKey`, `labelKey?`, `depth?: number` (levels drawn), `rootId?` | `Hierarchy` | Largest leaf | tree |
| REQ-417 | `SunburstChart` | `SpSunburstChart` | `sp-sunburst-chart` | `idKey`, `parentKey`, `valueKey`, `labelKey?`, `depth?: number`, `rootId?` | `Hierarchy` | Largest first-level arc | tree |
| REQ-418 | `TreeChart` | `SpTreeChart` | `sp-tree-chart` | `idKey`, `parentKey`, `labelKey?`, `valueKey?`, `orientation?: 'horizontal' \| 'vertical'` | `Hierarchy` | Root | tree |
| REQ-419 | `ParallelCoordinatesChart` | `SpParallelCoordinatesChart` | `sp-parallel-coordinates-chart` | `labelKey?`, `dimensions: readonly string[]`, `domains?: Record<string, [number, number]>` | `WideRows` | Polyline of the first row | grid (row × dimension) |
| REQ-420 | `PolarLineChart` | `SpPolarLineChart` | `sp-polar-line-chart` | `angleKey`, `valueKey`, `period?: number` (closes the line), `startAngle?` | `PolarPoints` | Maximum point | linear |
| REQ-421 | `PolarScatterChart` | `SpPolarScatterChart` | `sp-polar-scatter-chart` | `angleKey`, `radiusKey`, `sizeKey?`, `period?: number` (360) | `PolarPoints` | Point of largest radius | linear (angle order) |

### Wave 3 — fields and networks

| REQ | React | Vue | Angular selector | Own props | Data | Heighten | Keys |
|---|---|---|---|---|---|---|---|
| REQ-422 | `DensityBinChart` | `SpDensityBinChart` | `sp-density-bin-chart` | `xKey`, `yKey`, `binShape?: 'hexagon' \| 'rect'`, `binSize?: number` (px, 14) | `PointCloud` | Densest bin | grid |
| REQ-423 | `ContourChart` | `SpContourChart` | `sp-contour-chart` | `source: 'points' \| 'grid'`, `xKey`, `yKey`, `valueKey?` (grid), `levels?: number \| readonly number[]`, `filled?: boolean` | `PointCloud` \| `GridField` | Highest band | linear (level order) |
| REQ-424 | `DelaunayChart` | `SpDelaunayChart` | `sp-delaunay-chart` | `xKey`, `yKey`, `labelKey?`, `mesh?: 'delaunay' \| 'voronoi'` | `PointCloud` | Point of highest degree | linear (data order) |
| REQ-425 | `VectorFieldChart` | `SpVectorFieldChart` | `sp-vector-field-chart` | `xKey`, `yKey`, `uKey`, `vKey`, `scale?: number` | `VectorField` | Largest magnitude | grid |
| REQ-426 | `NetworkChart` | `SpNetworkChart` | `sp-network-chart` | `sourceKey`, `targetKey`, `valueKey?`, `nodes?: readonly NetworkNode[]`, `iterations?: number` (300) | `Flows` + `nodes` | Node of highest degree | linear (node order; Down walks its links) |

Own props the tables leave implicit:

- **`bins`** — a number asks for that many equal-width bins over the niced extent; an array gives the
  thresholds. Not increasing → default + `SP021`.
- **`bandwidth`** — in data units. Omitted, Silverman's rule (REQ-432). Shared by all groups of a
  chart so the shapes are comparable.
- **`rootId`** (REQ-439) — controlled. The chart draws that node as root and emits `onRootChange`;
  it never changes its own root.
- **`NetworkNode`** — `{ id: string; label?: string; group?: string; x?: number; y?: number }`. When
  every node has finite `x` and `y`, no layout runs (REQ-436).
- **`axis: 'date'`** on `IntervalChart` — `start`/`end` are ISO `YYYY-MM-DD`, day arithmetic in UTC
  (`charts/shared/dates.ts`), never the host time zone.

## 4. §9 Events — add

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onRootChange` | `@root-change` | `rootChange` | `string \| null` — the node id, `null` for the data root | `SunburstChart`, `SquarifiedTreemap`: a node is activated (click, Enter, Space); the centre or the current root's frame emits its parent (REQ-439) |

`onActiveChange` and `onSelect` keep their meaning. For a derived mark, `ActiveItem.value` is the
derived value (the bin count, the median) and `ActiveItem.datum` is a frozen summary object
(`{ x0, x1, count }`, `{ min, q1, median, q3, max, outliers }`, `{ id, path, value, share }`), never
the raw rows.

## 5. §10.1 `part` attributes and §10.2 CSS properties — unchanged

The new charts emit only the existing `part` values and `data-role` values (`encoding`, `ornament`,
`hatch`), and read only the existing `--sp-` properties (TD delta DD-035, REQ-450). Every ground, every
substrate and the Tailwind preset style them with no change (Art. 7).

## 6. §11 Diagnostics — add

| Code | Severity | Requirement | Condition |
|---|---|---|---|
| `SP020` | warn | REQ-437 | Invalid hierarchy: duplicate `id`, missing `parent`, cycle, or several roots; offending rows dropped (a synthetic root added for several roots). Names the first offending `id` |
| `SP021` | warn | REQ-433 | A statistic parameter is invalid (`bins`, `bandwidth`, `whisker`, `levels`, `overlap`, `iterations`); the default is used |
| `SP022` | warn | REQ-434 | A group is too small for its statistic; its observations are drawn as points |

`SP008` (volume) gains the ceilings of REQ-443.

## 7. §12 Limits and budgets — add

| Limit | `0.x` value | Behaviour on exceeding it |
|---|---|---|
| Observations, binned and density charts | 10 000 | `SP008` |
| Drawn points: beeswarm, polar scatter, connected scatter, Delaunay | 500 | `SP008` |
| Intervals | 200 | `SP008` |
| Hierarchy nodes | 500 | `SP008` |
| Network nodes / links | 150 / 600 | `SP008` |
| Field grid (contours, vector field) | 60 × 60 | `SP008` |
| Groups in box, violin, ridgeline | 12 (advisory) | No diagnostic; documented |
| Statistic over 1 000 observations | 4 ms | The CI benchmark fails |
| 60 × 60 field | 8 ms | The CI benchmark fails |
| 150-node network layout | 16 ms | The CI benchmark fails |
| Weight of `core` + `react` with one new chart | 45 KB min+gzip (unchanged) | CI fails (REQ-164) |
| One-chart build of an existing chart | No growth against `0.3.0` (± 0.1 KB) | CI fails (REQ-444) |

## 8. §13 Versioning

Each wave is a **minor** (new charts, props, codes). No existing default or output changes, so no
existing golden image moves; the CI check of REQ-444 makes that explicit.

## Constitution check

- **Art. 2** — §1 keeps the statistics internal and the generators behind §8.5; no signature exposes
  a library choice.
- **Art. 3** — no new paint `part`; the new charts render through the existing `create-chart` path in
  each adapter, so the markup contract is the 33 charts' contract.
- **Art. 5** — every chart names its keyboard model and its derived `ActiveItem`; `tree` is the APG
  pattern (REQ-438).
- **Art. 6** — one heighten per chart, declared per row (REQ-442).
- **Art. 8** — §7 holds the one-chart budget and adds the no-growth check for existing charts.
