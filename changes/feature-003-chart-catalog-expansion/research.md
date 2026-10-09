# Research — the TanStack Charts catalog against silverpoint's 33 charts

> Input to [`prd-delta.md`](prd-delta.md). Gathered 2026-10-08 from the public catalog at
> <https://tanstack.com/charts/catalog> ("v1 · Latest", React selector, 188 examples announced).
> Titles are quoted as the catalog prints them; the catalog gives titles and family tags only, so the
> mark type of an entry is read from its title and URL slug, and is marked *(inferred)* where that is
> all there is.

TanStack Charts is the **functional reference for the inventory** of this feature, as Monocharts was
for the first 28 charts and Ant Design for the UI components. Not a line of its code, of its example
data or of its visual language enters silverpoint (PRD §8, "Original work").

## What silverpoint takes, and what it leaves

| From the catalog | Taken? | In silverpoint instead |
|---|---|---|
| Which kinds of chart exist (the inventory) | **Yes** — the only thing taken | The 27-row gap list of §3 |
| Rendering approach, component API, theming, colours, gradients, animation | No | Core recipes → `Geometry` → thin adapters; grounds as data; tone by hatching; entry animation only (TD delta DD-035, DD-036) |
| Example datasets (penguins, Flare, Les Misérables, AAPL…) | No | Synthetic, original demos (Data Model delta §2) |
| Interaction patterns | No (out of scope, §5) | The existing readout and keyboard model, plus the APG tree pattern |

## 1. How each catalog entry was classified

| Class | Meaning | Where it goes |
|---|---|---|
| **Covered** | An existing silverpoint chart already draws it, possibly with the consumer's own data | Nothing to do |
| **Variant** | The mark type exists in silverpoint, but this entry needs a prop the chart does not have (N series, labels, a hole-less pie…) | A Delta Spec against the existing REQ (Art. 9) — proposed in §4, **not** part of this feature |
| **New** | A mark type, statistic or layout silverpoint does not have | **This feature**, REQ-400..REQ-426 |
| **Out of scope** | Excluded by PRD §5.2, or not a chart (theme, tooltip styling, data reducers) | Recorded with its reason in §5 |

The catalog is generous with variants: 81 of its titles are the `shadcn` series (area, bar, line,
pie, radar, radial, tooltip), which are styling variants of six mark types. Counted by **mark type**,
not by title, the gap is 27 new charts.

## 2. Covered by the existing catalog

| TanStack family · entry | silverpoint | REQ |
|---|---|---|
| line · *shadcn Line Chart*, *Linear*, *Step* | `LineChart`, `StepChart` | REQ-060, REQ-061 |
| trend · *Apple stock line with seasonal gaps* | `LineChart` with `null` gaps and `connectNulls` | REQ-060, REQ-008 |
| area · *shadcn Area Chart*, *Linear* | `AreaChart` | REQ-072 |
| composition · *Streamgraph* | `StreamChart` (two waves) | REQ-074 |
| bar · *Sorted vertical bars*, *Horizontal ranking with long labels*, *shadcn Bar Chart*, *Horizontal*, *Negative* | `BarChart` (`orientation`, negative domains reach zero) | REQ-064 |
| bar · *Stacked bars*, *shadcn Bar Chart - Stacked + Legend*; comparison · *Stacked and adjacent Seattle weather bars* (stacked half) | `StackedBarChart` | REQ-065 |
| bar · *Grouped bars*, *shadcn Bar Chart - Multiple* (two series) | `BarChart` with `secondaryKey` | REQ-064 |
| composition · *Annual gasoline-price waterfall* | `WaterfallChart` | REQ-067 |
| composition · *Sales conversion funnel* | `FunnelChart` | REQ-068 |
| composition · *Premium KPI sparklines* | `KpiCard`, `SparklineRows` | REQ-062, REQ-063 |
| financial · *Candlestick chart* | `CandlestickChart` | REQ-071 |
| range · *San Francisco temperature range band* | `RangeBandChart` | REQ-073 |
| pie · *shadcn Pie Chart - Donut*, *Donut with Text*, *Legend*; polar · *English letter frequency donut*, *Letter frequency donut with total* | `DonutChart` | REQ-075 |
| radar · *shadcn Radar Chart*, *Lines Only*; polar · *Simple radar chart* | `RadarChart` | REQ-076 |
| polar · *English letter frequency rose* | `CoxcombChart` | REQ-088 |
| polar · *Concentric letter frequency bars* (`100-radial-bars`); radial · *shadcn Radial Chart* | `RadialRings`, `PolarBarChart` | REQ-077, REQ-079 |
| radial · *Shape*, *Text*; polar · *Survey agreement share gauge*, *County unemployment gauge* | `GaugeArc`, `MeterChart`, `RadialArcGroup` | REQ-078, REQ-080, REQ-081 |
| relationship · *Bubble scatterplot*; performance · *Automobile specifications scatter* | `BubbleChart`, `ScatterChart` | REQ-082, REQ-083 |
| relationship · *AAPL lag-one autocorrelation* | `ScatterChart` over the consumer's lagged pairs | REQ-082 |
| matrix · *Labeled ordinal heatmap* | `HeatmapChart` with `columnLabels` | REQ-084 |
| time · *Precipitation calendar heatmap*, *Token use calendar heatmap* | `ActivityGrid` | REQ-087 |
| network · *Basic Sankey*, *Sankey* | `SankeyChart` | REQ-086 |
| application · *shadcn dashboard* | `Dashboard` composition | REQ-200 |
| interaction · *Pointer-selected tooltip*; tooltip · *Default*, *Formatter*, *Custom label* | Built-in readout and the custom renderer | REQ-141, REQ-142 |

silverpoint has five charts the catalog does not: `BulletChart`, `PyramidChart`, `VolvelleChart`,
`ChordRing`, `OrbitChart`.

## 3. New — the gap this feature closes (27 charts)

Grouped by the engine that will draw them, which is also how they are planned (§6 of the plan).

### 3.1 Distribution and statistics — cartesian engine + a new statistics module

| # | TanStack entry | silverpoint chart (proposed) | What is new |
|---|---|---|---|
| 1 | distribution · *Histogram*, *Cumulative histogram* | `HistogramChart` (`cumulative`) | Binning of raw observations in the core |
| 2 | distribution · *Empirical cumulative distribution* | `EcdfChart` | Sorted step function of raw observations |
| 3 | distribution · *Grouped boxplot* | `BoxPlotChart` | Quartiles, Tukey whiskers, outliers |
| 4 | distribution · *Violin distribution comparison* | `ViolinChart` | Kernel density per group, mirrored |
| 5 | distribution · *Ridgeline density comparison*; small multiples · *Faceted distributions* (the density half) | `RidgelineChart` | Kernel density per group, overlapping baselines |
| 6 | distribution · *Beeswarm distribution* | `BeeswarmChart` | Deterministic collision packing along one axis |

### 3.2 Comparison, change and ranking — cartesian engine

| # | TanStack entry | silverpoint chart (proposed) | What is new |
|---|---|---|---|
| 7 | comparison · *Ranked lollipop chart* | `LollipopChart` | Stem + head mark |
| 8 | comparison · *Dumbbell comparison*; change · *Metro inequality change arrows* (`32-change-arrows`) | `DumbbellChart` (`endMarker: 'dot' \| 'arrow'`) | Two values per category joined by a segment; the arrow form encodes direction |
| 9 | change · *Two-period slopegraph* | `SlopeChart` | Two parallel axes, one line per category |
| 10 | ranking · *Industry unemployment bump chart* | `BumpChart` | Ranks computed in the core per x; one line per series |
| 11 | uncertainty · *Point estimates with error bars* | `ErrorBarChart` | Point estimate + interval |
| 12 | interval · *Open-to-close price intervals* (`13-interval-timeline`); interaction · *Scrollable resource timeline lanes* (the static half) | `IntervalChart` | Floating bars on lanes over a numeric or date axis |
| 13 | survey · *Diverging Likert responses* | `DivergingBarChart` | Stacked segments centred on a neutral level |
| 14 | relationship · *Directed connected scatterplot* | `ConnectedScatterChart` | Ordered path through x-y points with direction marks |

### 3.3 Part-to-whole, hierarchy, multivariate and polar — own layouts

| # | TanStack entry | silverpoint chart (proposed) | What is new |
|---|---|---|---|
| 15 | part-to-whole · *English letter frequency waffle* | `WaffleChart` | Unit grid of cells, filled in reading order |
| 16 | part-to-whole · *Marimekko survey composition* (`64-marimekko-mosaic`) | `MarimekkoChart` | Variable-width stacked columns, both axes 100 % |
| 17 | hierarchy · *Flare analytics treemap* | `SquarifiedTreemap` | Squarified layout of a hierarchy. The existing `TreemapChart` (REQ-085) places tiles on a **declared grid** and is kept as is |
| 18 | hierarchy · *Flare analytics sunburst*, *Drillable Flare sunburst* | `SunburstChart` (`rootId`, controlled drill) | Radial partition of a hierarchy |
| 19 | hierarchy · *Tidy hierarchy tree* | `TreeChart` | Tidy (Reingold–Tilford) node-link tree |
| 20 | multivariate · *Parallel coordinates* | `ParallelCoordinatesChart` | N parallel value axes, one polyline per row |
| 21 | polar · *Seattle daily high-temperature polar line* | `PolarLineChart` | Closed or open line on angle × radius |
| 22 | polar · *Surface wind polar scatter* | `PolarScatterChart` | Points on angle × radius. `WindRose` (REQ-089) bins; this one does not |

### 3.4 Fields and networks — new geometry, possibly new dependencies

| # | TanStack entry | silverpoint chart (proposed) | What is new |
|---|---|---|---|
| 23 | distribution · *Hexagonally binned density*, *Quantitative binned heatmap* | `DensityBinChart` (`binShape: 'hexagon' \| 'rect'`) | 2-D binning of x-y points |
| 24 | distribution · *Point density contours*; spatial · *Filled wind-speed contours* | `ContourChart` (`source: 'points' \| 'grid'`) | Iso-lines and filled bands (marching squares) |
| 25 | spatial · *Delaunay spatial network*; interaction · *Voronoi nearest-point interaction* (the drawn half) | `DelaunayChart` (`mesh: 'delaunay' \| 'voronoi'`) | Triangulation and its dual |
| 26 | spatial · *Two-dimensional vector field* | `VectorFieldChart` | Arrow glyph per grid point (direction × magnitude) |
| 27 | network · *Les Misérables character network* | `NetworkChart` | Node-link graph with a deterministic layout |

With these, the catalog grows from 33 charts to **60**.

## 4. Variants — proposed Delta Specs, outside this feature

Each is a change to an already specified chart, so it enters as its own delta (Art. 9). Listed so the
gap list is complete; none is drafted here.

| Proposed delta | Covers (TanStack entries) | Charts touched |
|---|---|---|
| **delta-014 — N series on cartesian charts** (≤ 4, one per ramp level, beyond that by dash and label) | *shadcn Line Chart - Multiple*, *Bar Chart - Multiple* beyond two, *Industry unemployment with end labels*, *Indexed industry unemployment* (multi-line half) | `LineChart`, `AreaChart`, `BarChart` |
| **delta-015 — stacked and normalised areas** | *Industry unemployment stacked area*, *Industry share of unemployment*, *shadcn Area Chart - Stacked*, *Stacked Expanded*, *Step* | `AreaChart` (`stack`, `offset: 'none' \| 'expand'`, `curve: 'step'`), `StreamChart` beyond two waves |
| **delta-016 — data labels and annotations** | *shadcn … - Label*, *Custom Label*, *Label List*; *Annotated AAPL extrema*; *Industry unemployment with end labels* | cartesian and polar charts: `labels`, `endLabels`, `annotations` (reference line / point note) |
| **delta-017 — polar variants** | *shadcn Pie Chart* (no hole), *Separator None*, *Pie Chart - Stacked*, *Nested Flare package sizes* (`96-nested-donut`), *shadcn Radar Chart - Multiple*, *Grid Circle*, *Grid None*, *Radius Axis*, *Comparative radar chart* | `DonutChart` (`innerRadius: 0`, `rings`), `RadarChart` (series ≤ 4, `grid: 'polygon' \| 'circle' \| 'none'`) |
| **delta-018 — derived overlays and scales** | *Scatterplot with linear regression*, *San Francisco temperature moving averages*, *Apple close versus moving average*, *Bollinger band*, *Indexed industry unemployment*, *Log-scale Flare class sizes*, *Industry unemployment percentile ribbon* | `ScatterChart` (`trend: 'linear'`), `LineChart` (`movingAverage`, `index`), `RangeBandChart` (centre line, nested bands), log value scale |
| **delta-019 — secondary value axis** | *Seattle weather with three y axes* (two at most), *shadcn Bar Chart - Mixed* | `ComposedChart` |

## 5. Out of scope, with the reason

| TanStack family · entries | Reason |
|---|---|
| geography · all 8 (choropleths, bubble map, globe, projections, voyage, floor plan) | PRD §5.2: "Geographic charts and maps — another family of problems (projections, topology)" |
| motion · all 6 (staggered entrance, springs, morph, …) | PRD §5.2: the `0.x` line animates entry only; no transitions between datasets |
| interaction · *Focus and context*, *brush selection*, *Wheel zoom and pan*, *playback scrubber*, *Editable event range*, *Streaming window*, *Synchronized cursors*, *Free cursor*, *Snapped axis pointer*, *Grouped X tooltip*, *Interactive series legend*, *Linked chart and data table selection*, *Expanding pinned tooltip*, *band and rule cursors* | Not chart types. They need a richer interaction model (selections, viewport state, grouped readout) that touches every chart and REQ-108's "no local state" rule. Proposed as **feature-004 — interaction layer**, its own SDD cycle |
| tooltip · the nine *shadcn Tooltip* variants | Readout styling; REQ-142's custom renderer already lets the consumer draw any of them |
| theme · *Themed interactive area card*, *Active bar dashboard*, *Active donut metric*, *Theme palette matrix* | Theming is silverpoint's grounds (Art. 7); a "palette matrix" contradicts Art. 6 (tone by density, not palette) |
| bar · *Mean penguin mass reducer bars*; comparison · *Palmer penguins by species and sex* | Data reducers: PRD §5.2 keeps aggregation and the data layer out. The grouped-bar result is covered by `BarChart` once the consumer aggregates |
| small multiples · *Anscombe quartet small multiples* | Already composable with the `Dashboard`; shared scales across cells are PRD §5.3 future work |
| gradients (*shadcn Area Chart - Gradient*), *Icons* variants | A gradient is opacity as tone, which Art. 6 forbids; icons are consumer content (PRD §5.2, "An icon set") |

## 6. Observations that shape the PRD delta

| # | Observation | Consequence |
|---|---|---|
| 1 | Half of the new charts **derive** what they draw (bins, quartiles, densities, ranks, layouts) instead of drawing the rows as given | A statistics and layout module in the core (Art. 2), and a tabular alternative that shows the derived values, not only the raw rows (REQ-121 extended → REQ-431) |
| 2 | Density estimates and force layouts are sums and iterations over floating point; `Math.exp`, `Math.sin`, `Math.cos` are **not** required by ECMAScript to be correctly rounded, so Node and a browser may differ in the last bit, and an iteration can amplify it | Polynomial kernel (Epanechnikov), no transcendental functions inside iterations, a fixed iteration count (Art. 4, REQ-103 → REQ-432, REQ-435) |
| 3 | Hierarchies and graphs carry more categories than the 4-level tonal ramp | Identity by label, printed share, legend, position and order, toned with the catalog's existing `ringTone` rule; never by hatch alone (REQ-124 → REQ-440) |
| 4 | The drillable sunburst keeps state (the current root) | Controlled prop + event, no component state, so REQ-108 and parity hold (REQ-439) |
| 5 | The existing keyboard traversal is linear or grid (`interaction/hit-test.ts`) | Trees need the APG tree pattern (parent, first child, siblings) → REQ-438 |
| 6 | The catalog's examples use well-known public datasets (penguins, Flare, Les Misérables, AAPL) | silverpoint's demos stay synthetic and original, generated once and frozen (§4 of the Data Model, REQ-446) |
| 7 | Only 4 of the 27 need geometry that is not small, owned work: hierarchy layout, contours, triangulation | Owned by the core, no new dependency (DD-028, user decision 2026-10-08) |

Sources: [TanStack Charts catalog](https://tanstack.com/charts/catalog) ·
[nested donut entry](https://tanstack.com/charts/catalog/charts/96-nested-donut) ·
[change arrows entry](https://tanstack.com/charts/catalog/charts/32-change-arrows) ·
[interval timeline entry](https://tanstack.com/charts/catalog/charts/13-interval-timeline) ·
[Marimekko entry](https://tanstack.com/charts/catalog/charts/64-marimekko-mosaic) ·
[binned heatmap entry](https://tanstack.com/charts/catalog/charts/24-quantitative-binned-heatmap) ·
[Delaunay entry](https://tanstack.com/charts/catalog/charts/37-delaunay-network)
