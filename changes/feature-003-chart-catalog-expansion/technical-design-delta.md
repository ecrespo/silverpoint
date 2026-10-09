# Technical Design delta — catalog expansion

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3, approved 2026-10-09 by Ernesto Crespo (Phase 1) |
| **Amends** | [Technical Design](../../specs/technical-design.md) v1.8 → v1.9: §3.2, new DD-028..DD-036, §5.1, §5.3, §7, §8, §10 |
| **Requirements** | REQ-400..REQ-426, REQ-430..REQ-450 |

## 1. §3.2 Components — add

```
packages/core/src/
├── charts/
│   ├── shared/                 # where the 33 charts already keep what families share
│   │   ├── stats.ts            # NEW — bins, quantiles, five-number summary, ECDF, ranks (DD-029)
│   │   ├── density.ts          # NEW — Epanechnikov KDE on a fixed sample grid (DD-029)
│   │   ├── distribution.ts     # NEW — buildDistribution(family, …): the group axis + value axis
│   │   │                       #   skeleton of box, violin and ridgeline, as points.ts serves scatter
│   │   │                       #   and bubble and tracks.ts the radial tracks
│   │   ├── beeswarm.ts         # NEW — greedy, value-ordered packing (DD-030)
│   │   ├── hierarchy.ts        # NEW — stratify + SP020, squarify, partition, tidy tree, reroot (DD-033)
│   │   ├── field.ts            # NEW — grid validation, density splat, marching squares, 2-D bins
│   │   ├── delaunay.ts         # NEW — Bowyer–Watson with exact predicates, Voronoi by clipping
│   │   ├── network.ts          # NEW — deterministic force layout (DD-030)
│   │   └── cartesian.ts, polar.ts, cells.ts, points.ts, card.ts, shell.ts, format.ts, dates.ts
│   │                           #   REUSED as they are; `ringTone` moves from polar.ts to cells.ts
│   │                           #   (re-exported from polar.ts) so non-polar charts can use it (DD-032)
│   └── <27 new>/<slug>.ts + demo.ts   # one recipe and one frozen demo per chart, as today (DD-036)
└── interaction/
    └── hit-test.ts             # + `tree` traversal (DD-031)
```

No new top-level module: the new code sits where the first catalog put the code its families share
(`charts/shared/`), and follows its conventions (DD-036).

Adapters gain **no** module: each new chart is one more file through the existing `create-chart`
(React), `ChartShell` (Vue) and the Angular base component. Their only new surface is the
`onRootChange` event of two charts (DD-033).

## 2. Design decisions

### DD-028: Every algorithm is owned by the core; no new dependency

- **Decision:** the core **owns** every statistic and layout of this feature: binning, quantiles,
  kernel density, ECDF, ranking, beeswarm packing, waffle allocation, mosaic, the hierarchy layouts
  (stratify, squarify, partition, tidy tree), 2-D binning, marching squares, the Delaunay
  triangulation and its Voronoi dual, and the network layout. **No runtime dependency is added**; the
  allowlist of §5.3 is unchanged. *User decision, 2026-10-08 (OQ-C2).*
- **Context:** the first catalog took `d3-chord` as "solved work with no differential value"
  (DD-005). For this feature the user chose the other rule of §5.3 —owning the code prevents the
  surface from growing without anyone noticing— and it also buys something DD-005 did not need:
  **control over floating point** in every derived coordinate (REQ-435), which a library can change
  under a minor version and silently move every consumer's golden images.

| Option | Pros | Cons |
|---|---|---|
| **A. Own everything (chosen)** | No new dependency (Art. 8); every operation inside a sum or iteration is ours to keep correctly rounded (REQ-435); nothing upstream can move a canonical | More code to write and test: tidy tree, squarify, marching squares and Delaunay are subtle |
| B. Own the small, take `d3-hierarchy`, `d3-contour`, `d3-delaunay` | Battle-tested generators | Three allowlist entries; `d3-contour`'s density and `d3-delaunay`'s float paths are not under our REQ-435 discipline; rejected by the user |
| C. Also take `d3-force` | Familiar API | Trigonometric initial placement; see DD-030 |

- **How the subtle ones are made safe:**
  - **Tidy tree** — Buchheim, Jünger and Leipert's linear-time Reingold–Tilford; arithmetic only.
    Tested against hand-computed layouts of the classic cases (unbalanced subtrees, a single chain,
    wide fan-out) and the property "no two nodes of one depth closer than the node gap".
  - **Squarify** — Bruls, Huizing and van Wijk; worst-aspect-ratio comparison by multiplication and
    division only. Property: tile area ∝ value (I-25), tiles disjoint and covering their parent.
  - **Marching squares** — the 16-case table with linear interpolation on cell edges and the two
    saddle cases resolved by the cell's centre average; rings assembled and oriented so filled bands
    use the even-odd rule. Point density for `source: 'points'` is a grid splat of the Epanechnikov
    kernel (DD-029), not a blur, so it stays polynomial.
  - **Delaunay** — Bowyer–Watson, points inserted in `(x, y, index)` order after snapping to the
    2-decimal output grid, i.e. integers in hundredths of a pixel. `orient2d` is exact in doubles at
    that magnitude; `inCircle` is evaluated in doubles with a static error bound and, when the bound
    is inconclusive, **exactly with `BigInt`**. Degenerate inputs (duplicates, collinear sets) are
    handled by the predicates, not by perturbation. The Voronoi cells are the triangles'
    circumcentres, clipped to the plot by Sutherland–Hodgman.
- **Weight:** the code lives in the new `charts/shared` modules (§1), reached only from the recipes that use
  it, so it tree-shakes out of every other chart (REQ-444). Each new chart is held to the 45 KB
  one-chart budget like any other; the hierarchy and field modules are measured when their wave lands.
- **Consequences:** §5.3 and REQ-106 unchanged. The lint that forbids `Math.random`/`Date.now` on the
  render path (REQ-004) is extended to forbid `Math.exp`, `Math.log`, `Math.pow`, `Math.sin`,
  `Math.cos`, `Math.atan2` inside those new modules, with a reviewed allow-comment for
  the two single calls of DD-029.

### DD-029: Statistics — methods fixed, inputs sorted once, outputs rounded at the boundary

- **Decision:** `charts/shared/stats.ts` and `density.ts` implement the methods REQ-432 names. Every function takes a **sorted
  copy** (ties ordered by original index, so the result does not depend on sort stability), returns
  plain frozen data, and rounds only where geometry is emitted (REQ-002), never in between.
- **Kernel:** Epanechnikov, `K(u) = ¾(1 − u²)` on `|u| ≤ 1` — polynomial, so the density sum uses
  only `+ − × ÷`. A Gaussian kernel would call `Math.exp`, which ECMAScript does not require to be
  correctly rounded: Node and a browser may differ in the last bit (REQ-435's reasoning applied to
  sums). The density is evaluated at **64** points over the shared value domain per group, then
  passed through the existing curve engine (`curveMonotoneX` along the value axis).
- **Bandwidth:** Silverman, `0.9 · min(σ, IQR/1.34) · n^(−1/5)`. `n^(−1/5)` needs `Math.pow`, which is
  not guaranteed correctly rounded either; it is called **once** per chart and its result is rounded
  to 6 significant digits before use, which makes a cross-engine difference in the drawn coordinates
  improbable rather than impossible. The hydration e2e of T-179 watches it in Firefox and WebKit;
  if it ever fires, the fallback is a 32-entry table of `n^(−1/5)` with linear interpolation.
- **Bins:** Freedman–Diaconis width `2·IQR·n^(−1/3)` (same rounding rule as the bandwidth), snapped
  to the nice step of the value scale so bin edges fall on axis ticks; Sturges when `IQR = 0`.
- **Quantiles:** Hyndman–Fan type 7 (linear interpolation; R's and NumPy's default).
- **Ranks:** competition ranking ("1224"); equal values take the same rank, ties broken for **line
  order only** by the series' first appearance in `data`.

### DD-030: Deterministic layouts — greedy beeswarm, fixed-iteration network

- **Beeswarm (REQ-405):** not iterative. Points are placed in ascending value order (ties by index);
  each takes the smallest offset across the axis —alternating sides, starting on the side the seed
  picks— at which it touches no placed point. Candidates come from the exact tangency condition with
  each nearby placed point, which needs only `Math.sqrt`. `O(n log n)` with a sweep window; the result
  is a pure function of the sorted values, the radius and the seed.
- **Network (REQ-426):** Fruchterman–Reingold with a linearly cooling temperature over a fixed
  `iterations` (300). Start: nodes on a square grid in an order permuted by the core's seeded PRNG
  (`render/prng.ts`), so no trigonometry. Inside the iteration: pairwise repulsion `k²/d`, link
  attraction `d²/k`, displacement capped by the temperature — `+ − × ÷` and `Math.sqrt` only.
  `O(n²)` per iteration: 150 nodes × 300 iterations ≈ 3.4 M pair updates, which is REQ-445's 16 ms
  budget **to be confirmed by the T-195 benchmark**; if it fails, the default `iterations` drops to
  the largest value that fits and the docs say so.
- **Consumer layout (REQ-436):** when every node carries finite `x` and `y`, positions are only scaled
  to the plot.
- **Test:** the cross-engine determinism test of §8 runs both layouts in Node, Chromium, Firefox and
  WebKit and compares the serialised geometry byte for byte.

### DD-031: A `tree` keyboard model in the interaction engine

- **Decision:** `HitArea` gains an optional `node?: { id: string; parent: string | null; depth:
  number; order: number }`. `stepTree` beside `stepLinear` and `stepGrid` implements REQ-438: Down/Up
  move in depth-first pre-order (`order`), Right to the first child (no-op on a leaf), Left to the
  parent (no-op on the root), Home/End to the first/last node.
- **Announcement:** the path is built in the core from `parent` links ("Budget › Operations › Travel:
  12 400, 8 % of Operations") and passed as the active item's label, so the adapters announce it as
  they announce any item.
- **Why not `aria-tree` markup:** the charts expose one focusable SVG with a roving active item and a
  tabular alternative (REQ-121); adding a parallel `role="tree"` DOM would change the markup contract
  of every adapter for two charts. The data table of a hierarchy chart adds `level` and `path`
  columns instead (REQ-431).

### DD-032: Category identity beyond the ramp — the catalog's own rule, `ringTone` and labels

- **Decision:** many-category charts (waffle, Marimekko, sunburst, treemap, network groups) tone their
  categories exactly as `DonutChart` and the polar charts already do: `ringTone(index, count)` walks
  the ground's ramp in turn and never gives two neighbours the same level, and **the tone only repeats
  what a label, a printed share or the legend already says** (the rule written above `ringTone` in
  `charts/shared/polar.ts`, REQ-124). Value-driven tone (density bins, contours, treemap leaves by
  share) uses `toneOf(ratio)`, as `HeatmapChart` and `ActivityGrid` do.
- **Identity:** a direct label where the shape holds it (the `TreemapChart` label + share pattern), the
  `sectorLegend` column with names and shares where it does not —its "+N more" row included— and the
  tabular alternative always (I-29).
- **Rejected — cycling the hatch angle per category** (proposed in the first draft of this delta): the
  hatch angle is a **ground token** (Data Model §3.4, −41° / +49°), so a chart choosing angles would put
  style into chart code (Art. 7), and it would invent a visual device silverpoint's grammar does not
  have. Withdrawn on 2026-10-08.
- **Under `weight` (REQ-447):** the same levels, drawn as weight by the ground's inker; nothing in the
  recipe changes.

### DD-033: Derived items and the controlled root

- **Derived `ActiveItem`:** recipes put a frozen summary object in `HitArea.datum` (API delta §4);
  `modelBase` receives the derived table (REQ-431). No raw row reaches the readout of a derived mark.
- **Root:** `reroot(hierarchy, rootId)` is pure: it returns the subtree, rescaled to the full
  extent, and an `up` item for the centre (sunburst) or the frame (treemap). Activation of a node
  goes through the existing `onSelect` path; the adapter maps it to `onRootChange(node.id)` for
  these two charts. No adapter stores the root (REQ-108), so a server render with `rootId` is the
  same markup as a client render with it (Art. 3).

### DD-034: One catalog row per chart; three waves through the same gates

- **Decision:** each new chart is a row in `tools/visual-gate/catalog.ts` (recipe, subpath, consumer
  sample with non-default accessors) and the gates, adapter tests and docs generator iterate it, as
  they do for the 33. A wave is complete when its rows are green in every gate; waves do not change
  the gates.
- **Consequence:** adding a chart touches the core recipe, its demo, one file per adapter and one
  catalog row — the cost profile Phase 2 measured for the cartesian family.

### DD-035: Every new chart is drawn with the grammar the 33 already use

TanStack Charts is the **inventory** of this feature and nothing else: no rendering approach, mark
style, colour, animation or API shape is taken from it. Each new chart is drawn with silverpoint's
existing vocabulary, and REQ-450 makes that a check: **no new `StrokePart`, `StrokePaint`, `LabelKind`,
`--sp-` variable or `part` attribute.**

The vocabulary, as the code has it (`types/geometry.ts`, Data Model §3):

| Element | What it means in silverpoint | Where the 33 use it |
|---|---|---|
| `role: 'encoding'`, exact | The datum's geometry; the inker never touches it (Art. 1) | Every bar, line, sector, tile, point |
| `role: 'ornament'`, `part: 'grid' \| 'axis' \| 'rule'` | Hand-inked: grids, axes, rules, legend swatches | Radar rings and spokes, value axes, tracks |
| `tone: 1..4` on a closed shape | Hatching on the ground's ramp (−41°, level 4 cross-hatched), shared tile per level (DD-007) | Bars tone 2, the secondary series tone 1, radar polygon tone 1, heatmap by `toneOf` |
| `part: 'ink-secondary'`, `dash: 'dotted'` | The second, comparison series ("previous", "low") | `BarChart` secondary, `RangeBandChart` low line |
| `heighten` | One element: `part: 'heighten', paint: 'fill'` **plus** the same path `part: 'ink', paint: 'stroke'` (REQ-031) | `LineChart`'s last live point, `StepChart` |
| Pill shape (`pillPath`) | The catalog's bar | `BarChart`, `StackedBarChart`, `FunnelChart` |
| Card (`cardLayout`) | Title, badge, metric value and unit, footer left/right, EB Garamond, small caps | All 33 |
| Printed values | The number is written where it fits; tone only repeats it | Heatmap cells, treemap tiles, donut legend shares |

How each new chart uses it (encoding exact; tone and ornament as the table above):

| Chart | Encoding marks | Tone | Ornament (inked) | Heighten | Printed / labels |
|---|---|---|---|---|---|
| Histogram | Abutting bins, square tops (`rectPath`, not pills: bins are contiguous) | 2; cumulative: 1 under an `ink` top line | Value axis, grid, ticks at bin edges | Modal bin | Bin counts on top when they fit; footer `n` and the bin rule |
| ECDF | Step line (`curveStepAfter`, as `StepChart`); quantile markers as `rule` | — | Axes, grid at 0.25/0.5/0.75 | Median crossing point | Two groups at most: `ink` and `ink-secondary` dotted, the catalog's two-series grammar |
| Box plot | Box (`rectPath`), median line (heavier weight), whiskers with caps, outliers as `circlePath` | Box 1 | Group and value axes | Highest median | Group labels on the category axis |
| Violin | Mirrored density outline (closed path), quartiles as short `ink-secondary` dotted rules | 1 | Group and value axes | Highest median mark | Group labels |
| Ridgeline | One open density line per group, **outline only**, as an engraver draws overlapping profiles | 0 (no fill: overlapping hatch would read as value) | Baselines as `rule`, value axis | Front ridge's peak | Group names at each baseline |
| Beeswarm | The scatter point mark of `points.ts` | — | Value axis | Maximum observation | `label` in readout and table |
| Lollipop | Stem line + head circle | Head 2 | Category and value axes | Largest head | Values at the heads when they fit |
| Dumbbell | Start mark `ink-secondary` dotted outline, end mark `ink` tone 2 (the `BarChart` "previous / current" pairing), connector `ink`; arrow end exact | End 2 | Axes | Largest change's end mark | Both values; direction also in the table |
| Slopegraph | One segment per category between two vertical axes; decreases `ink-secondary` dotted | — | The two period axes | Largest change | Label and value at both ends (no legend) |
| Bump | One line per series through rank positions, with rank dots | — | Rank rows as grid | Last point of the rank-1 series | Series names at both ends, as direct labels |
| Error bars | Interval line with caps, estimate as a circle | Estimate 2 | Axes; `reference` as a dotted `rule` | Estimate furthest from the reference | Estimate printed when it fits |
| Interval | Floating pills (`pillPath`) on lanes | 2 | Lane rules, time/value axis | Longest interval | Lane names; interval label inside when it fits |
| Diverging bars | Abutting segments in one row, centred on a `rule` | Distance from neutral → 1..3, neutral 0 (outline only); the **side** carries the sign | Centre rule, percentage axis | Largest positive share | Level names in a top legend; shares in segments that fit |
| Connected scatter | Ordered `ink` path, small exact chevrons for direction | — | Axes, grid | Last point | Labels at the ends and where given |
| Waffle | Square cells (`rectPath`, inset) | `ringTone` by category | — | The largest category's cells as **one** path | `sectorLegend` with names and shares |
| Marimekko | Tiles (`rectPath`, inset) | `ringTone` by segment | Column labels, 0–100 % axis | Largest cell | Segment label + share in tiles that fit (treemap pattern) |
| Squarified treemap | Tiles (`rectPath`, inset per depth) | Leaves by `toneOf(share)`; parents level 0 with an `ink` frame | — | Largest leaf | Label + share, as `TreemapChart` |
| Sunburst | Sectors per depth (`sectorPath`, the donut's arc engine) | First level `ringTone`; descendants one level lighter than their parent, never below 1 | Ring guides as `grid` | Largest first-level arc | Centre readout as `DonutChart` (root name, total); rim labels where they fit |
| Tree | Links (d3-shape's link generator, already allowed), nodes as circles | Nodes by depth, 2 → 1 | — | Root | Node labels beside the nodes |
| Parallel coordinates | One polyline per row | — | One `axis` per dimension with its ticks | First row's polyline (heighten + ink outline) | Dimension names on the axes |
| Polar line | Line on the radar's frame (`polarFrame`) | — | Rings and spokes as `grid`, as `RadarChart` | Maximum point | Rim labels for `period` divisions |
| Polar scatter | The scatter point mark on `polarFrame` | — | Rings and spokes | Point of largest radius | Rim labels |
| Density bins | Hexagons or rectangles | `toneOf(count / max)`, as `HeatmapChart` | Axes | Densest bin | A four-step key of count ranges (the ramp's levels) |
| Contours | Iso-lines `ink`; filled bands closed shapes | Bands by `toneOf(level)` | Axes | Highest band | Level values on the lines where they fit |
| Delaunay / Voronoi | Edges `ink-secondary`, points `ink` | — | Axes | Point of highest degree | Labels where given |
| Vector field | Arrows, length ∝ magnitude | — | Axes, grid | Largest magnitude | Magnitude scale in the footer |
| Network | Links `ink-secondary`, nodes as circles | Groups by `ringTone` | — | Node of highest degree | Labels for the highest-degree nodes; `sectorLegend` of groups |

### DD-036: Every new chart is implemented the way the 33 are

The anatomy of a recipe, as `bar-chart.ts`, `line-chart.ts` and `donut-chart.ts` have it, is the
template; a reviewer should be able to read any new recipe against one of those line by line.

| Step | Convention | Reused from |
|---|---|---|
| 1 | `const CHART = 'HistogramChart'`; `build<Name>(props, context): ChartModel` | — |
| 2 | Demo rule: `usesDemo = props.data === undefined`; keys from `<NAME>_DEMO_KEYS` when it is (REQ-098) | `demo.ts` pattern |
| 3 | Read with `read`/`accessorName`, validate with `finite`, warn with `warnValue` / `diagnose` | `shared/format.ts`, `shared/cells.ts`, `diagnostics/` |
| 4 | Derive (the new step): statistics or layout from the new `shared` modules | §1 |
| 5 | `modelBase(CHART, props, context, '<Kind> chart', table)` with the derived table (REQ-431) | `shared/shell.ts` |
| 6 | `measure` → deferred model at 0 px (REQ-009); `emptyModel` on no data (REQ-007) | `shared/shell.ts` |
| 7 | `cardLayout` → `area`; `cartesianPlot` or `polarFrame` → plot | `shared/card.ts`, `cartesian.ts`, `polar.ts` |
| 8 | Axes: `valueAxis`, `horizontalValueAxis`, `categoryAxis`, `categoryLabels`, `rimLabels` | `shared/cartesian.ts`, `polar.ts` |
| 9 | Push `strokes`, `labels`, `hitAreas` in the DD-035 grammar | — |
| 10 | Heighten: one mark, two strokes (fill `heighten` + `ink` outline) | `step-chart.ts` pattern |
| 11 | Description string: "`${name}`. *Kind* of *n* … ; *summary*." | every recipe |
| 12 | `readyModel(base, description, { viewBox, plot, strokes, labels, hitAreas })` | `shared/shell.ts` |
| 13 | `export const histogramChart: ChartRecipe<HistogramChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build })` | every recipe |

Around the recipe, unchanged conventions: `demo.ts` exports a frozen `<NAME>_DEMO` and
`<NAME>_DEMO_KEYS`; the props interface lives in `types/props.ts` with JSDoc stating "Ignored without
`data`" on every accessor (REQ-099); the recipe is exported from `index.ts`; React adds one file
`createClientChart(recipe)` (or the server variant when the chart has no interaction, REQ-104); Vue one
`Sp<Name>.vue` over `ChartShell` with typed props and emits; Angular one standalone component over the
existing base; the gates read one row in `tools/visual-gate/catalog.ts`. When two or more new charts
share a skeleton, it becomes a family builder in `shared/` (as `buildPoints`, `buildTracks`,
`buildScalar`): `buildDistribution` for box, violin and ridgeline.



## 3. §5.1 Monorepo structure — amend

Add the new `charts/shared/` modules of §1. `tools/demo-gen/` (new, private): the one-off
script that generates the synthetic demo datasets with a fixed seed and prints them as frozen
literals; its output is committed, it never runs at render time (REQ-446).

## 4. §5.3 Runtime dependency allowlist — unchanged

`@silverpoint/core` keeps `d3-scale`, `d3-shape`, `d3-chord` (DD-028). The rule under the table
is extended: besides `extent`/`max`/`min`, the statistics and layouts of this feature are owned.

## 5. §7 Diagnostics — add

| Code | Raised in | Stripped in production |
|---|---|---|
| `SP020` | `charts/shared/hierarchy.ts` | Yes |
| `SP021`, `SP022` | `charts/shared/stats.ts`, `density.ts`, recipes | Yes |

## 6. §8 Testing strategy — add

| Test | What it proves | REQ |
|---|---|---|
| Reference values | Every statistic against values computed independently (R / NumPy, recorded in the test with their command) for the demo datasets and edge cases (ties, n = 1, IQR = 0) | REQ-432 |
| Property tests | Bin counts sum to n; ECDF is monotone and ends at 1; quartiles ordered; ranks a permutation with ties; waffle cells sum to `cells`; mosaic areas ∝ values; treemap areas ∝ values within 0.5 px² | REQ-400..REQ-416 |
| **Cross-engine determinism** | The core's geometry for every new chart's demo, serialised in Node and in Playwright Chromium, Firefox and WebKit, byte-identical | REQ-435, REQ-103 |
| Mode invariance | `role: 'encoding'` vertices equal in `ink` and `precision`, every new chart | REQ-441, REQ-006 |
| Owned layouts | Tidy tree, squarify, marching squares and Delaunay against hand-computed cases and their properties (DD-028); Delaunay: empty-circumcircle property on every triangle, checked with the exact predicate, on random, grid-aligned, collinear and duplicate inputs | REQ-416..REQ-418, REQ-423, REQ-424 |
| Forbidden maths | Lint: no transcendental `Math.*` in the new `charts/shared` modules beyond the two reviewed calls | REQ-435 |
| Grammar | Type test: the new recipes compile against the unchanged `StrokePart`, `StrokePaint`, `LabelKind`; the stylesheet diff of each wave adds no `--sp-` variable and no `part` | REQ-450 |
| Tree keyboard | `stepTree` over every key × leaf/root/middle × first/last sibling | REQ-438 |
| Hierarchy validation | Each invalid case drops the right rows and raises `SP020` once with the first id | REQ-437 |
| No-growth | `size-limit` of every existing one-chart build against the `0.3.0` record | REQ-444 |
| Benchmarks | REQ-445's four budgets | REQ-445 |

## 7. §10 Open questions — add

| # | Question | Leaning |
|---|---|---|
| OQ-C1 | Three waves as `0.4.0`, `0.5.0`, `0.6.0`, or fewer, larger releases? | **Decided 2026-10-08:** three waves |
| OQ-C2 | Take `d3-hierarchy`, `d3-contour`, `d3-delaunay`, or own them? | **Decided 2026-10-08:** own them in the core (DD-028 A) |
| OQ-C3 | Export the statistics publicly (`@silverpoint/core/stats`)? | **Decided 2026-10-09:** no for `0.x`; it would freeze method signatures under SemVer before the charts have used them |
| OQ-C4 | PR fixture matrix for the new charts: full or reduced? | **Decided 2026-10-08:** full on every PR (600 chart fixtures) |
| OQ-C5 | Ship `DelaunayChart` and `VectorFieldChart` (COULD) in wave 3, or drop them to a later minor? | **Decided 2026-10-09:** ship if wave 3 is on budget; they are cheap once the field engine exists |

## Constitution check

- **Art. 1** — DD-029's density outline and DD-030's layouts emit `role: 'encoding'` strokes the
  inker never touches; DD-035 classifies every mark of the 27 charts.
- **Art. 2** — all of §1 is in the core; adapters add one event mapping (DD-033), no maths.
- **Art. 3 / Art. 4** — DD-029 and DD-030 remove the cross-engine sources of drift (transcendental
  calls inside sums and iterations, unseeded starts) and §6 adds the test that proves it.
- **Art. 6 / Art. 7** — DD-035 draws every new chart with the existing tones, parts and heighten rule; DD-032 uses the existing `ringTone`/`toneOf` and leaves the hatch angle to the ground.
- **Art. 8** — DD-028 adds no dependency; the allowlist is unchanged and the new code tree-shakes
  (REQ-444). The constitution's stack row is amended only because it was already stale (`d3-chord`).
