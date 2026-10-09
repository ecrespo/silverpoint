# Data Model delta — catalog expansion

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3, approved 2026-10-09 by Ernesto Crespo (Phase 1) |
| **Amends** | [Data Model](../../specs/data-model.md) v1.6 → v1.7: §1, new §2.15..§2.24, §2.1, §2.2, §2.7 ("Used by"), §4, §5, §6 |
| **Requirements** | REQ-400..REQ-426, REQ-430..REQ-450 |

## 1. §2 Input data contracts — add

As in the existing contracts, field names are the **defaults**; every one is redefined with the
`*Key` accessors of API delta §3. Rows that break a contract are dropped with `SP002` unless a row
below names another code.

### Existing shapes reused

- **§2.1 `CategorySeries`** — add to "Used by": lollipop.
- **§2.2 `SectorSeries`** — add: waffle.
- **§2.7 `Flows`** — add: network (links), with `value` optional (default 1) for the network only.

### 2.15 `Observations` — histogram, ECDF, box plot, violin, ridgeline, beeswarm

```ts
type Observations = ReadonlyArray<{ value: number; group?: string; label?: string }>;
```

| Field | Type | Validation |
|---|---|---|
| `value` | `number` | Finite; `null`/non-finite dropped with `SP002` (REQ-008) |
| `group` | `string` | Optional; groups ordered by first appearance. Required by the ridgeline |
| `label` | `string` | Beeswarm only: names the point in the readout and table |

Derived, never input: bins `{ x0, x1, count }` (`x0` inclusive, `x1` exclusive except the last);
five-number summary `{ min, q1, median, q3, max, outliers[] }` where `min`/`max` are the whisker
ends; density `{ at, value }[64]`.

### 2.16 `Paired` — dumbbell, slopegraph

```ts
type Paired = ReadonlyArray<{ label: string; start: number; end: number }>;
```
`label` unique; both values finite, else the row is dropped. `names` (prop) titles the two values;
default `['start', 'end']`.

### 2.17 `Ranked` — bump

```ts
type Ranked = ReadonlyArray<{ x: string | number; series: string; value: number }>;
```
Long format. A series missing at an `x` has no rank there and its line breaks (REQ-008's
`connectNulls` applies). Derived: `rank` per (`x`, `series`), competition ranking (DD-029).

### 2.18 `Estimates` — error bars

```ts
type Estimates = ReadonlyArray<{ label: string; estimate: number; low: number; high: number }>;
```
Invariant `low ≤ estimate ≤ high`. If `low > high`, swapped with `SP002` (as the range band does);
if the estimate falls outside, the row is drawn and warned with `SP002` — an asymmetric interval is
legitimate, an estimate outside it is not.

### 2.19 `Intervals` — interval

```ts
type Intervals = ReadonlyArray<{ lane: string; start: number | string; end: number | string; label?: string }>;
```
`axis: 'number'`: finite numbers. `axis: 'date'`: ISO `YYYY-MM-DD`, parsed to UTC days. `start >
end` → swapped with `SP002`; `start = end` → drawn as a tick of the minimum width. Lanes ordered by
first appearance.

### 2.20 `Likert` and `WideRows` — diverging bars, parallel coordinates

```ts
type Likert   = ReadonlyArray<{ label: string } & Record<string, number>>; // one count or share per level
type WideRows = ReadonlyArray<{ label?: string } & Record<string, number>>; // one value per dimension
```
Likert: the `levels` prop names the columns in order, from most negative to most positive; values
`≥ 0`, negatives dropped with `SP002`. With `percent`, each row is normalised to 100 by the core.
Parallel coordinates: `dimensions` names the axes in order; each axis' domain is derived from the
data unless `domains` gives it (REQ-097).

### 2.21 `PathPoints`, `PolarPoints` — connected scatter, polar line, polar scatter

```ts
type PathPoints  = ReadonlyArray<{ x: number; y: number; label?: string }>;   // order = path order
type PolarPoints = ReadonlyArray<{ angle: number; value: number; size?: number }>;
```
`angle` in the units of `period` (360 by default; 12 for months, 24 for hours), taken modulo
`period`. Polar `value` is the radius: `≥ 0`, negatives dropped with `SP002` (as §2.2).

### 2.22 `Mosaic` — Marimekko

```ts
type Mosaic = ReadonlyArray<{ column: string; segment: string; value: number }>;
```
`value ≥ 0`. A missing (`column`, `segment`) pair counts as 0. Column width ∝ column total; segment
height ∝ share of the column. Columns and segments ordered by first appearance.

### 2.23 `Hierarchy` — squarified treemap, sunburst, tree

```ts
type Hierarchy = ReadonlyArray<{ id: string; parent: string | null; value?: number; label?: string }>;
```

| Field | Validation |
|---|---|
| `id` | Non-empty, unique. A duplicate is dropped (`SP020`) |
| `parent` | `null` for the root; otherwise an existing `id`. Missing parent or cycle → row dropped (`SP020`) |
| `value` | On leaves: `≥ 0`, finite. On internal nodes: **ignored** — an internal node's value is the sum of its children, so the drawing can never contradict itself |
| several roots | A synthetic root `id: '∅'`, labelled with the chart's `title` or `'All'`, is added (`SP020`) |

Flat rows rather than nested `children`, so every chart keeps the row-shaped `data` its tabular
alternative is built from. Derived per node: `depth`, `order` (pre-order), `value`, `share` of its
parent, `path`.

### 2.24 `PointCloud`, `GridField`, `VectorField`, `NetworkNode` — wave 3

```ts
type PointCloud  = ReadonlyArray<{ x: number; y: number; label?: string }>;
type GridField   = ReadonlyArray<{ x: number; y: number; value: number }>;      // a regular grid
type VectorField = ReadonlyArray<{ x: number; y: number; u: number; v: number }>;
interface NetworkNode { id: string; label?: string; group?: string; x?: number; y?: number }
```
`GridField` and `VectorField` must form a regular grid: the distinct `x` and `y` values, sorted,
define it; a missing cell is a hole (contours treat it as below every level), a duplicate cell keeps
the first with `SP002`. Network: links whose `source` or `target` is not in `nodes` (when `nodes` is
given) are dropped with `SP002`; without `nodes`, nodes are the distinct ends of the links. A
self-link is drawn as a loop of fixed radius.

## 2. §4 Demo datasets — add

27 new frozen constants in `packages/core/src/charts/<chart>/demo.ts`, **synthetic and original**
(REQ-446): generated once by `tools/demo-gen` with a fixed seed, printed as literals and committed.
Nothing is generated at render time (unlike `ActivityGrid`, which the first catalog had to pin after
the fact).

| Chart | Demo | Exercises |
|---|---|---|
| Histogram, ECDF, beeswarm | 240 reading-time observations, right-skewed, with ties | FD bins, ties, a long tail |
| Box, violin, ridgeline | 5 groups of 24 to 60, one bimodal, one with outliers | Whiskers, outliers, bimodal density; renders with no diagnostic. The `SP022` fallback (a group of 4) is a fixture-only dataset (A-09) |
| Lollipop | 12 categories, sorted descending | `sort`, long labels |
| Dumbbell, slopegraph | 10 categories, two periods, two of them decreasing | `endMarker: 'arrow'` direction both ways |
| Bump | 6 series × 8 periods, with one tie | Competition ranking, crossings |
| Error bars | 8 estimates with asymmetric intervals, `reference: 0` | Intervals crossing the reference |
| Interval | 4 lanes × 3–5 intervals, dates in one quarter | Date axis in UTC, overlapping intervals in a lane |
| Diverging bars | 6 questions × 5 levels, neutral in the middle | Neutral split across the centre |
| Connected scatter | 14 yearly points, one loop | Direction marks, a self-crossing path |
| Waffle | 5 categories summing to 1 000, largest-remainder to 100 cells | Rounding of shares to cells |
| Marimekko | 4 columns × 4 segments | Variable widths |
| Treemap, sunburst, tree | 3 levels below the root, 38 nodes, 24 leaves at two depths (a fictional budget; 16 leaves would force single-child chains, corrected in T-167) | Squarify, more categories than levels, paths, leaves at mixed depths |
| Parallel coordinates | 30 rows × 5 dimensions | Mixed domains |
| Polar line | 12 monthly values, `period: 12` | Closing the line |
| Polar scatter | 150 points, angle in degrees | Wrap at 360 |
| Density bins, contours (points) | 1 200 points from two overlapping clusters | Hex bins, density levels |
| Contours (grid) | 40 × 30 grid of a smooth synthetic surface | Filled bands, holes |
| Delaunay | 60 points | Triangulation, convex hull |
| Vector field | 20 × 14 grid, a vortex | Arrow scaling |
| Network | 40 nodes in 4 groups, 90 links | Layout, degree, four groups toned by `ringTone` with a legend (DD-032) |

## 3. §5 The fixture matrix — amend

Chart fixtures iterate the catalog (DD-034), so the axes are unchanged and the count scales with it.

| Matrix | 33 charts (today) | 60 charts | Δ |
|---|---|---|---|
| PR: charts × 2 modes × `md` × `tile` × 5 substrates | 330 | **600** | + 270 |
| Nightly: charts × 54 (`silverpoint` 4 × 2 hatch × 2 modes × 3 sizes = 48, + `cyanotype` 1 × 2 modes × 3 sizes = 6) | 1 782 | **3 240** | + 1 458 |

The full matrix runs on every PR, new charts included (OQ-C4, user decision 2026-10-08).
Dashboard (90) and component (510) fixtures are unchanged. Each wave adds its rows only.

Two **state fixtures** beyond the demo, because the demo cannot show them: `SunburstChart` and
`SquarifiedTreemap` with `rootId` set to a second-level node (× the same axes), and `NetworkChart`
with consumer positions (REQ-436).

## 4. §6 Invariants — add

| # | Invariant | Requirement |
|---|---|---|
| I-23 | Statistics are pure and order-independent: shuffling `data` yields deep-equal derived values and, apart from the tabular alternative's row order, an identical model | REQ-430, REQ-432 |
| I-24 | Bin counts sum to the number of finite observations; ECDF is non-decreasing and ends at 1; `min ≤ q1 ≤ median ≤ q3 ≤ max` | REQ-400..REQ-402 |
| I-25 | Hierarchy: every drawn node's value equals the sum of its drawn children (leaves: their own); treemap tile and sunburst arc measures are proportional to value within 2-decimal rounding | REQ-416, REQ-417, REQ-437 |
| I-26 | Waffle: cells across categories sum exactly to `cells`; a category with a positive value gets ≥ 1 cell when `cells ≥` the number of categories | REQ-414 |
| I-27 | Iterative layouts: the geometry is byte-identical in Node, Chromium, Firefox and WebKit for the same seed | REQ-435 |
| I-28 | No two points of a beeswarm overlap: centre distance ≥ `2 × radius − 0.01` | REQ-405 |
| I-29 | Every category of a chart is reachable by keyboard and present in the tabular alternative, whether or not it has a direct label | REQ-440 |
| I-30 | A chart with `rootId` renders identically on the server and the client; no adapter holds root state | REQ-439 |

## Constitution check

- **Art. 1 / Art. 2** — every derived value in §1 is computed by the core and drawn as encoding;
  the contracts say which values are ignored (an internal node's `value`) so the drawing cannot
  contradict the data.
- **Art. 3 / Art. 4** — demos are literals (§2), and I-23 and I-27 make order and engine irrelevant.
- **Art. 5** — I-29: identity and reachability do not depend on what fits on screen.
- **Art. 9** — every invariant names its REQ and gets a test in the plan.
