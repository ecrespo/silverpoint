# silverpoint — Data Model Specification

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **Version** | 1.9 |
| **Date** | 2026-10-20 |
| **Storage** | None — there is no database |
| **Related Tech Design** | [`technical-design.md`](technical-design.md) v1.11 |
| **Related API Spec** | [`api-spec.md`](api-spec.md) v1.12 |

> **Template adaptation note.** The template assumes persisted collections. silverpoint
> stores nothing: its «entities» are three families of in-memory data —the input
> contracts each chart consumes, the tokens of each ground, and the fixture matrix that
> feeds the Art. 3 gates—. Indexes, migrations and retention do not apply and are omitted.

---

## 1. Model Overview

```
        ┌──────────────────┐
        │  Input contract  │   what the consumer passes in `data`
        │  (§2)            │   12 input shapes for the first 33 charts, §2.15..§2.24 for the
        │                  │   second 27; §2.13 for the dashboard layout; §2.14 and §2.27
        │                  │   for the UI components; §2.26 for a palette
        └────────┬─────────┘
                 │  accessors
                 ▼
        ┌──────────────────┐        ┌──────────────────┐
        │  Geometry        │◀───────│  Ground (§3)     │  declarative tokens
        │  (API Spec §3.1) │  ink   │  palette, ramp,  │
        └────────┬─────────┘        │  inking          │
                 │                  └──────────────────┘
                 ▼
        ┌──────────────────┐
        │  Fixture (§5)    │   the unit that CI compares
        └──────────────────┘
```

None of the three is persistent and all three are serializable to JSON, which is what
makes it possible to version the fixtures and compare outputs.

## 2. Input data contracts

Twelve input shapes cover the first catalog's 33 charts, a thirteenth contract (§2.13) describes the
dashboard layout, and §2.15..§2.24 add the second catalog's shapes (§2.1, §2.2 and §2.7 serve it
too). §2.14 and §2.27 are the value contracts of the UI components, and §2.26 the palette a
consumer passes as `palette`. The field names are the **defaults**: all of them
are redefined with the `*Key` accessors of API Spec §7.

### 2.1 `CategorySeries` — 14 cartesian charts

```ts
type CategorySeries = ReadonlyArray<{
  [xKey: string]: string | number;   // category or numeric value of the axis
  [valueKey: string]: number | null; // one or more series
}>;
```
Used by: line, step chart, area, bars, stacked bars, composed, stream, waterfall, funnel,
scatter, bubble, KPI card, range band, coxcomb, lollipop. Sparkline rows have their own shape (§2.11).

| Field | Type | Required | Validation |
|---|---|---|---|
| axis key | `string \| number` | Yes | Non-empty; duplicates allowed only in scatter and bubble |
| series key | `number \| null` | Yes | Finite or `null`; `NaN` and `Infinity` raise `SP002` |

**Range band** is the only case with two mandatory keys, `lowKey` and `highKey`, and it
requires `low ≤ high` per row; if that does not hold they are swapped and warned with
`SP002`.

### 2.2 `SectorSeries` — 7 polar charts

```ts
type SectorSeries = ReadonlyArray<{ name: string; value: number }>;
```
Used by: donut, polar bars, radial arc group, radial rings, radar, coxcomb, wind rose, waffle.

| Field | Type | Validation |
|---|---|---|
| `name` | `string` | Non-empty; unique within the set |
| `value` | `number` | `≥ 0`. Negative values raise `SP002` and are dropped: a sector with a negative angle does not exist |

Maximum 60 sectors (`SP008`).

### 2.3 `ScalarPercent` — 2 meters

```ts
type ScalarPercent = number;   // 0 to 100
```
Used by: gauge arc, semicircular meter. Out of range it saturates at the ends and is
warned with `SP002`.

### 2.4 `MatrixRows` — density heatmap

```ts
type MatrixRows = ReadonlyArray<{ label: string; values: readonly number[] }>;
```
All rows MUST have the same length; if they differ the shortest is used and a warning is
issued. The value is normalised against `scaleMax`, 100 by default.

`columnLabels?: readonly string[]` (a prop, not a field of the rows) names the columns in order:
they head the table columns, the keyboard announcement and the readout, and are drawn above the
cells. Missing names fall back to `#k`; names beyond the drawn columns are ignored with `SP002`.
Without it the output is unchanged.

### 2.5 `TileShares` — treemap

```ts
type TileShares = ReadonlyArray<{
  label: string; share: number; cols: number; rows: number; tone?: number;
}>;
```
`cols` and `rows` are cells of the declared grid; the sum of `cols × rows` must not
exceed the component's `columns × rows`. `share` is informative, it does not size the tile.

### 2.6 `OHLC` — candlestick

```ts
type OHLC = ReadonlyArray<{
  time: string; open: number; high: number; low: number; close: number;
}>;
```
Per-row invariant: `low ≤ min(open, close)` and `high ≥ max(open, close)`. If it does not
hold, `SP002` and the row is dropped. The scale bounds are derived from the set unless
they are supplied (`bounds`); if the set is empty and there are no `bounds`, `SP009`.

### 2.7 `Flows` — sankey and chord ring

```ts
type Flows = ReadonlyArray<{ source: string; target: string; value: number }>;
```
`value > 0`. The chord ring derives from this a square matrix of unique categories; above
12 categories, `SP010`. The network (§2.24) reads its links from this shape too, with `value`
optional (default 1) for the network only.

### 2.8 `Contributions` — activity grid

```ts
type Contributions = ReadonlyArray<{
  date: string;   // ISO 8601, date only
  count: number;  // ≥ 0
  level: 0 | 1 | 2 | 3 | 4;
}>;
```
The length must be a multiple of 7. `level` is the tonal level already quantised by the
consumer: the library does **not** derive it from `count`, because the cut-off criterion
belongs to the domain, not to the drawing.

### 2.9 `Targets` and `Tiers` — bullet and pyramid

```ts
type Targets = ReadonlyArray<{ title: string; actual: number; target: number }>;
type Tiers   = ReadonlyArray<{ label: string; width: number; tone?: number }>;
```
`actual` and `target` in 0-100. `width` in 0-100, and it is expected to be monotonically
increasing in the pyramid; if it is not, it is drawn anyway and warned.

### 2.10 `Orbits` — armillary orbits

```ts
type Orbits = ReadonlyArray<{
  label: string;
  markers: ReadonlyArray<{ period: number; value: number }>;
}>;
```
`period` normalised to 0-1 over the cycle. Each orbit is a concentric ring, from the
inside out in array order.

How the props read it: `data` holds the orbit rows; `orbits` caps the orbits shown, from the
inside out; `markerKey` reads a row's markers (default `'markers'`); `periodKey` reads a marker's
period (default `'period'`). A marker's `value` and an orbit's `label` are read from those fields.
A period outside 0-1, or a non-finite or negative value, raises `SP002` and drops the marker.

### 2.11 `SparklineRows` — sparkline rows

```ts
type SparklineRowsData = ReadonlyArray<{
  name: string;               // nameKey
  readout?: string | number;  // readoutKey; the last value when absent
  points: readonly unknown[]; // seriesKey; each read through pointKey
}>;
```
`rows` caps the rows shown, from the first. `pointKey` reads a point's value; by default a point
that is a number is its own value, and an object's `value` field is read.

### 2.12 `VolvelleData` — volvelle

```ts
type VolvelleData = ReadonlyArray<{
  label: string;               // the ring's name
  segments: readonly string[]; // its categories, clockwise, in equal angles
}>;
```
- `data` holds the rings, from the inside out; `rings` caps how many are shown.
- The rings share one angle frame: ring *k*'s *n* segments each span 360°/*n*, the first starting
  at 12 o'clock.
- `indexRing` (0-based, default 0) and `indexValue` (default: that ring's first segment) choose
  the **index angle**: the middle of that segment. The drawing is turned so the index angle faces
  12 o'clock, under a fixed pointer. They apply to the demo rings as to the consumer's (REQ-098).
- The **combined readout** is, for every ring, the segment that contains the index angle
  (half-open spans, `[start, end)`), printed as `label segment` pairs and marked on each ring.
- An `indexRing` out of range or an `indexValue` absent from its ring raises `SP002` and falls
  back to the default.

### 2.13 `DashboardLayout` — the layout contract

The type is in API Spec §7.1. Its rules:

| Field | Domain | Default | Invalid value |
|---|---|---|---|
| `columns[bp]` | integer 1..12 | `sm 1, md 2, lg 4` | Non-integer or out of range → the default for that breakpoint, `SP002` |
| `rowHeight` | number > 0 | `240` | → default, `SP002` |
| `gap` | number ≥ 0 | `16` | → default, `SP002` |
| `cells[].id` | non-empty string, unique | — | Duplicate → the later ones are unplaced, `SP015` |
| `colSpan[bp]` | integer ≥ 1 | `1` | > `columns[bp]` → clamped, `SP014`; < 1 or non-integer → `1`, `SP002` |
| `rowSpan[bp]` | integer 1..6 | `1` | → clamped to range, `SP002` |

A bare number in `colSpan` / `rowSpan` / `columns` applies to all three breakpoints.

**Matching children to cells** (REQ-205), in order:

1. Children with a `cell` id found in `layout.cells` take that cell's spans.
2. The reading order is the order of `layout.cells`; children whose cell is placed follow it.
3. Children with no `cell`, or an unknown one, are appended in source order with span 1 (`SP015`
   for an unknown id).
4. Layout cells with no child are dropped (`SP015`); they leave no hole.

**Chart ids** (REQ-209): `${dashboard.id}--${cell.id}`; for an unplaced child,
`${dashboard.id}--${index}` with its source index. The existing consumer-id sanitiser applies.

### 2.14 Component value contracts

| Component | Value | Domain | Invalid value |
|---|---|---|---|
| Input | `string`; `message?: string` | any; an empty `message` is no message | Empty `message` → no message element and no `aria-describedby` |
| Checkbox, Switch | `boolean` | — | Non-boolean → `Boolean(v)`, no warning |
| RadioGroup, Segmented, Tabs | a key of `items` | existing, enabled key; `null` only for RadioGroup | Unknown key → RadioGroup `null`; Segmented and Tabs the first enabled key; `SP017` is not used (not a range) — silent, documented |
| Slider | `number` | `[min, max]`, on `step` from `min` | → clamped, rounded to the nearest step, `SP017` (REQ-324) |
| Rate | integer | `0..count` | → clamped and rounded, `SP017` |
| Progress | `number` or absent | `0..100`; absent = indeterminate | → clamped, `SP017` |
| Steps `current` | integer | `0..items.length − 1` | → clamped, `SP017` |
| `items[].key` | non-empty string | unique in the list | Duplicate → later skipped, `SP019` (REQ-325) |
| `min`, `max`, `step` | finite numbers, `min < max`, `step > 0` | — | → defaults `0`, `100`, `1` with `SP017` |
| `count` (Rate) | integer 1..10 | — | → clamped, `SP017` |

Fractions (DD-025) are `(value − min) / (max − min)`, rounded to 2 decimals (REQ-002); `0` and `1`
are exact at the ends.

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

### 2.25 Derived items and keyboard moves

Not input: what a recipe of the second catalog hands the interaction engine (API Spec §3.1, internal).

- **Derived datum.** A derived mark's `HitArea.datum` is a frozen summary —`{ x0, x1, count }` for a
  bin, `{ min, q1, median, q3, max, outliers }` for a box, `{ id, path, value, share }` for a node—,
  never the raw rows, and `value` is the derived value (REQ-431).
- **`HitArea.node`** `{ id, parent, depth, order }` places a hierarchy node in its tree (`order` is
  the depth-first pre-order).
- **`HitArea.moves`** `Partial<Record<key, index>>`: the hit-area index each key leads to.
  `stepActive` follows it before the linear and grid models. The hierarchy charts fill it with the
  tree pattern (`treeMoves`, REQ-438); the network with its own model (Right/Left the nodes, Down a
  node's links, Up back to it). A chart without it keeps the linear or grid model, so no other
  chart carries the code (REQ-444).

### 2.26 `Palette` — a palette

A palette (feature-004) re-inks a chart, a component, a dashboard or a provider's subtree without a
ground of its own: every field is optional and sets one custom property on the root.

| Field | Custom property | Threshold against the substrate |
|---|---|---|
| `substrate` | `--sp-substrate` | — (the background of every pair) |
| `ink` | `--sp-ink` | 4.5 |
| `inkSecondary` | `--sp-ink-secondary` | 4.5 |
| `heighten` | `--sp-heighten` | exempt (always outlined, §3.3); see §3.9 for its own pairs |
| `rule` | `--sp-rule` | 3 |
| `grid` | `--sp-grid` | 3 |
| `text` | `--sp-text` | 4.5 |
| `textMuted` | `--sp-text-muted` | 4.5 |
| `focus` | `--sp-ui-focus-color` | 3 |

The order of this table is the order of every emitted declaration (REQ-461). A value is any CSS
colour, by allowlist: a hex, a keyword, or a colour function (`rgb`…`oklch`, `color`, `color-mix`,
`light-dark`, `var`) over numbers, idents and `--custom` names; anything else (quotes, escapes, `;`,
`{`, `<`, `url(`, `image-set(`) is dropped (`SP024`, REQ-467). `paletteStyle` applies the same test.

*Amended in implementation:* `SP023` measures a palette against its **own** `substrate`,
else cream `#EDE7DA` — the core does not know the resolved ground's substrate colour when it
resolves a palette. `SP024`'s warning is development-only; the dropping is not.

**Layers** (REQ-462). `resolvePalette` merges provider → dashboard cell → element, field by field,
the later layer winning; an `undefined` field is skipped silently (Vue and Angular hand absent
ones), and a nested provider inherits its parent's palette. The declarations are written first in
the root's `style`, the component's own after them. *Amended in implementation:* a
chart's palette is on the adapter's `.sp-root` frame, and on the `<svg>` in the core's
`toSVGString`.

**The presets** (`@silverpoint/core/palettes`, deep-frozen, I-31):

| Preset | `substrate` | `ink` | `inkSecondary` | `heighten` | `rule` = `grid` | `text` | `textMuted` |
|---|---|---|---|---|---|---|---|
| `silverpoint` | `#EDE7DA` | `#5A5E65` | `#685C4D` | `#FFFFFF` | `#737A82` | `#3F4348` | `#5A5E65` |
| `sanguine` | `#F2E8DC` | `#8A3A24` | `#6A4A3A` | `#FFFFFF` | `#9A6450` | `#4A2216` | `#7A3E2C` |
| `sepia` | `#F0E6D2` | `#6B4C2C` | `#5A5148` | `#FFFFFF` | `#8A6E52` | `#3B2A18` | `#6B4C2C` |
| `ironGall` | `#EEEAE0` | `#3C4858` | `#6A4E36` | `#FFFFFF` | `#6C7584` | `#232B36` | `#4A5566` |
| `verdigris` | `#E7EDE6` | `#2C6355` | `#65563F` | `#FFFFFF` | `#5C7B71` | `#1F3D36` | `#3E6A5E` |
| `indigo` | `#E9EAF1` | `#3A4884` | `#675641` | `#FFFFFF` | `#68709A` | `#232C52` | `#4A5590` |

Values are Reflex 0.7's, unchanged; their contrast is in feature-004's `research.md` §5 and is
re-measured by the gate (REQ-464, §3.9). `focus` is unset in every preset (the ground's default is
`ink`). *Amended in implementation (budget):* the presets and the palette functions live on
the subpath `@silverpoint/core/palettes` (only the types stay on the main entry, which keeps the
core's full bundle under 45 kB), and `PALETTE_NAMES` is written out so an unused preset
tree-shakes (REQ-519).

### 2.27 Value contracts of the composed components

| Component | Value | Domain | Invalid value |
|---|---|---|---|
| Table `data` | rows (`Datum[]`) | any; a missing cell renders empty | — |
| Table `columns[].key` | non-empty string | unique | duplicate → later skipped, `SP019` |
| Table `sortKey` | a column key | a sortable column | unknown → no column sorted, silent |
| Pagination `current` | integer | `1..count`, `count = max(1, ceil(total / pageSize))` | → clamped, `SP017` |
| Pagination `total`, `pageSize` | integers | `total ≥ 0`, `pageSize ≥ 1` | → `0`, `10`, `SP017` |
| InputNumber | `number \| null` | `[min, max]`, `precision` decimals | → clamped and rounded, `SP017`; `null` is valid (empty field) |
| InputNumber `min`/`max`/`step` | finite, `min ≤ max`, `step > 0` | — | → unset bounds, step `1`, `SP017` |
| Descriptions `columns` | integer | `1..6` | → clamped, `SP017` |
| Textarea | `string` | `≤ maxLength` when set (the native attribute enforces it) | — |
| Select | a key of `items` | existing, enabled, or `null` | unknown → `null`, silent (as RadioGroup, A-06) |
| TimelineList `status` | `done \| current \| pending \| error` | at most one `current` | a second `current` renders as `done`, `SP017` |
| Overlay `open` | `boolean` | — | non-boolean → `Boolean(v)` |
| Toast `duration` | ms | `≥ 1000`, or `Infinity` (no auto close) | → `1000`, `SP017` |

**Sort order** (`uiSortRows`): rows whose value is `null` or missing go last, in input order;
numbers compare numerically and before strings; strings compare by code point after
`toLowerCase()` (no locale, so the order is the same on every server); ties keep input order.
`desc` reverses the present rows only.

**Page window** (`uiPageWindow(count, current, siblings)`): `1`; `start-gap` when
`current − siblings > 2`; the pages from `max(2, current − siblings)` to
`min(count − 1, current + siblings)`; `end-gap` when that end is `< count − 1`; `count` when
`count > 1`. Reflex 0.7's algorithm, unchanged.

*Amended in implementation* (and after the commit security review of 2026-10-19):

- The table draws its rows **as given**: the consumer sorts, with `uiSortRows`, so paging works
  over the sorted rows (DD-040); `sortKey` only marks the sorted column.
- A Table column's `width` is a plain length (`px`, `%`, `em`, `rem`, `ch`, `vw`); `SpSurface`'s
  `as` and `name` are lowercase idents (`script`, `style`, `iframe`, `object`, `embed`,
  `template`, `noscript` refused). Each is otherwise dropped with `SP017`.
- `uiNumberValue` also returns `range`, the range as drawn, for the `min`/`max`/`step` attributes.
- Optional keys (Breadcrumb, Descriptions, TimelineList) are deduplicated only when given.
- An accordion Collapse is named `${id}--accordion` by `uiCollapseGroup`; without an `id`, `SP017`.
- A link's `href` (SpButton, SpBreadcrumb) keeps only relative URLs and `http`, `https`, `mailto`,
  `tel`, read as a browser reads it; any other scheme is dropped with `SP017` (`safeHref`).
  `headingLevel` (SpCard, SpDescriptions, SpResult) is held to `2..6`, else `h3` with `SP017`: a
  tag is never built from a value.
- A paused toast restarts its whole `duration` once pointer and focus leave it: the time left would
  need a clock on the render path (Art. 4).

### 2.28 `AgentCatalog`

```ts
interface AgentCatalog {
  readonly schema: 1;
  readonly version: string;                         // library version (REQ-534)
  readonly reflex: { readonly version: string; readonly wraps: string; readonly stale: boolean };
  readonly frameworks: readonly Framework[];        // ['react', 'vue', 'angular', 'reflex']
  readonly common: { readonly chart: readonly PropEntry[]; readonly ui: readonly PropEntry[] };
  readonly charts: readonly ChartEntry[];           // 60, catalog order
  readonly components: readonly ComponentEntry[];   // 38, UI_COMPONENTS order
  readonly dashboard: { readonly props: readonly PropEntry[]; readonly layout: readonly PropEntry[]; readonly cell: readonly PropEntry[]; readonly names: Names; readonly imports: Imports };
  readonly grounds: readonly { readonly name: string; readonly substrates: readonly string[]; readonly summary: string }[];
  readonly palettes: { readonly fields: readonly PropEntry[]; readonly presets: Readonly<Record<string, Palette>> };
  readonly timeline: { readonly props: readonly PropEntry[]; readonly names: Names; readonly imports: Imports; readonly peer: string };
  readonly diagnostics: readonly { readonly code: string; readonly severity: 'warn' | 'error'; readonly req: string; readonly what: string; readonly todo: string }[];
  readonly stylesheets: { readonly always: readonly string[]; readonly ui: readonly string[]; readonly timeline: readonly string[] };
}
type Framework = 'react' | 'vue' | 'angular' | 'reflex';
type Names = Readonly<Record<Framework, string>>;
type Imports = Readonly<Record<Framework, string>>;
interface PropEntry {
  readonly name: string;            // camelCase, as the types
  readonly reflex?: string;         // snake_case, from the Reflex catalog; absent when Reflex lacks it
  readonly type: string;
  readonly optional: boolean;
  readonly default?: string;        // from API Spec §5.1 / JSDoc "Default `…`."
  readonly doc: string;
}
interface ChartEntry {
  readonly slug: string; readonly names: Names; readonly imports: Imports;
  readonly family: Family; readonly summary: string;
  readonly data: DataSpec; readonly intents: readonly Intent[];
  readonly props: readonly PropEntry[];   // own props only; common ones in `common.chart`
  readonly demo: string;                  // demo export name
  readonly drillable?: boolean;           // rootId + onRootChange
}
interface ComponentEntry {
  readonly slug: string; readonly names: Names; readonly imports: Imports;
  readonly family: 'ui' | 'composed' | 'overlay'; readonly group: string; readonly summary: string;
  readonly props: readonly PropEntry[];
  readonly binding?: { readonly value?: Readonly<Record<Framework, string>>; readonly open?: Readonly<Record<Framework, string>> };
  readonly events: readonly string[]; readonly slots: readonly string[];
}
```

### 2.29 Chart metadata (`tools/agent-catalog/charts.meta.ts`)

The only hand-written data of the catalog: per chart `family` (the nine the site and the Reflex
wrapper show, slugged as the site's anchors: `lines`, `bars`, `areas`, `points-grids`, `flows`,
`radial`, `distributions-comparisons`, `hierarchies-dimensions`, `fields-networks`; fixed at #227,
and `AgentCatalog.families` carries slug and title), a one-line `summary`, `data: DataSpec` and
`intents`. The components' one-line summaries live beside it, in `components.meta.ts`: the core's
component types carry none.

```ts
interface DataSpec {
  readonly shape: DataShape;                  // API Spec §14.3
  readonly fields: readonly { readonly role: string; readonly prop: string; readonly type: 'string' | 'number' | 'date'; readonly required: boolean }[];
}
```

`fields[].prop` names the accessor prop (`xKey`, `valueKey`, `sourceKey`…) the role maps to; this is
what `generate_code` uses to turn the user's field names into accessors.

### 2.30 Reflex catalog (`reflex-catalog.json`, exported by `reflex-silverpoint-react`)

```ts
interface ReflexCatalog {
  readonly schema: 1;
  readonly package: 'reflex-silverpoint-react';
  readonly version: string;                    // the wheel's version
  readonly wraps: string;                      // SILVERPOINT_VERSION
  readonly charts: readonly { readonly slug: string; readonly builder: string; readonly cls: string; readonly family: string; readonly props: readonly { readonly name: string; readonly js: string; readonly type: string }[] }[];
  readonly components: readonly { readonly slug: string; readonly builder: string; readonly cls: string; readonly props: readonly { readonly name: string; readonly js: string; readonly type: string }[]; readonly positional: readonly string[]; readonly deprecated: Readonly<Record<string, string>> }[];
  readonly helpers: readonly string[];         // sort_rows, check_palette, silverpoint_palette, download_svg…
}
```

### 2.31 Recommender rules (`tools/agent-catalog/recommend.rules.ts`)

```ts
interface Rule {
  readonly shape: DataShape; readonly intent: Intent;
  readonly charts: readonly { readonly slug: string; readonly score: number; readonly reason: string }[];
  readonly adjust?: readonly { readonly when: 'rows>' | 'rows<' | 'values>'; readonly n: number; readonly slug: string; readonly delta: number; readonly reason: string }[];
}
```

*Amended in implementation* (feature-005, #227..#236, folded as built):

- `DataField.type` adds `array` (a sparkline's points, a heatmap row's values, an orbit's markers).
- `ChartEntry.demo` is optional (`GaugeArc` and `MeterChart` draw from props alone) and names a
  constant of the core's sources, not a public export; `demoKeys` and `demoSample` (the demo's first
  three rows) show the data by example.
- `ComponentEntry.events` and `slots` are per framework (`react`, `vue`, `angular`): a Vue `emits`
  and an Angular `output` are not React handler names. `binding` is set only when all three adapters
  bind it; `states` is carried from `UI_COMPONENTS`; `demo` holds the first `UI_DEMOS` state's props.
- A stale Reflex catalog marks each chart and component entry `stale: <wrapped version>` (REQ-556).
- `ReflexCatalog` gains the optional `derived` (the interim pin, read from the wrapper's sources)
  and `common` (the shared props' Python names).
- `AgentCatalog.recommend` carries the rule table of §2.31, which `recommend_chart` reads.

## 3. The `silverpoint` ground

### 3.1 Prepared substrates

The four tones Cennini documents for the prepared ground, adjusted until the whole
palette meets the contrast minimums of Art. 5.

| Name | Value | Historical reference |
|---|---|---|
| `cream` | `#EDE7DA` | Calcined bone ground, the most common one |
| `green` | `#D8DCD0` | Grey-green, the classic of the Florentine notebooks |
| `blue` | `#D2D8DF` | Pale blue |
| `ochre` | `#E7DABC` | Ochre |

### 3.2 Inks, with verified contrast

Values computed against the four substrates. The «min» column is the worst case, which
always falls on `blue`.

| Token | Value | min | Threshold | Role |
|---|---|---|---|---|
| `text` | `#3F4348` | 6.94 | 4.5 (text) | The large metric and the primary labels |
| `ink` | `#5A5E65` | 4.54 | 4.5 (text) | The silverpoint: main series and secondary text |
| `secondary` | `#685C4D` | 4.53 | 4.5 (text) | Tarnished silver: second series |
| `rule` | `#737A82` | 3.03 | 3.0 (object) | Rules and baseline |
| `grid` | `#737A82` | 3.03 | 3.0 (object) | Grid |
| `heighten` | `#FFFFFF` | 1.23 | — | White heightening. **Exempt by outline, see §3.3** |

`textMuted` is kept as a slot of the schema but in this ground it **resolves to the same
value as `ink`**. The reason is measurable: over a light substrate there is no room for a
softer grey that still meets 4.5:1. Typographic hierarchy then comes out of size,
tracking and capitals, which is exactly how a 16th-century book resolved it — not out of
colour. A ground with a dark substrate, such as `cyanotype`, will have room and will be
able to give it a value of its own.

### 3.3 The heightening rule

White on a light substrate does not reach 3:1 against the background and never will: it
is a property of the colour, not a defect of the choice.

**THE SYSTEM SHALL always draw the outline of the heightened element with `ink`.** That
way the boundary of the shape is defined by a stroke that does comply, and the white
becomes interior treatment. It is also historically correct: lead white is applied inside
an already drawn outline, not over bare paper.

The contrast that really carries the information is heightening against ink, which is
worth **6.51:1**.

### 3.4 Tonal ramp

Five levels. Density grows up to level 3; level 4 adds the second crossed layer, which is
how an engraver achieves the darkest tone.

| Level | Style | `hachureGap` | Angle | Use |
|---|---|---|---|---|
| 0 | no fill | — | — | Empty, background |
| 1 | `hachure` | 10 | −41° | Lightest tone |
| 2 | `hachure` | 7.5 | −41° | |
| 3 | `hachure` | 5.5 | −41° | |
| 4 | `cross-hatch` | 5.5 | −41° and +49° | Darkest tone |

Each level produces **one `<pattern>` tile per chart instance** (REQ-029, REQ-030), not
one hatching per shape.

### 3.5 Inking parameters

| Parameter | Value | Why |
|---|---|---|
| `roughness` | 0.45 | *Burin* setting: hand, not scribble |
| `bowing` | 0.6 | |
| `strokeWidth` | 0.9 | Fine stroke, proper to silverpoint |
| `fillWeight` | 0.55 | Finer than the outline |
| `hachureGap` | 7 by default | Almost halves the bytes against 4.5, and an engraving has countable lines |
| `preserveVertices` | `true` | Non-negotiable (Art. 1) |
| `maxHatchDensity` | gap ≥ 4 | Lower bound; below it the hatching clogs |
| `domainPadding` | 0.1 | Expansion of degenerate domains (REQ-010) |

### 3.6 Typography

| Token | Value |
|---|---|
| `display` | `'EB Garamond', 'Iowan Old Style', Georgia, serif` |
| `scale` | 1.0 |

A single family. Figures are set with `font-variant-numeric: tabular-nums`, which
activates the `tnum` feature verified present in the subset. Small-caps lines use
`text-transform: uppercase` with a tracking of 0.18em, because the distributed build does
not include `smcp`.

### 3.7 The `cyanotype` ground

Herschel's cyanotype (1842), as Anna Atkins printed it: a white line on Prussian blue. Its tonal
mechanism is **line weight** (REQ-028, TD DD-019), so it hatches nothing: a toned shape is drawn
as its own outline, and the tone is how thick that outline is.

**Substrate.** One: `prussian`, `#1B3F6B`. With a single substrate, the ground declares its
colours on the ground-wide rule, so a chart that names another substrate (`cream` is the library
default) is still painted on Prussian blue.

**Inks, with verified contrast** against `prussian`:

| Token | Value | Ratio | Threshold | Role |
|---|---|---|---|---|
| `text` | `#F4F6F8` | 9.84 | 4.5 (text) | The large metric and the primary labels |
| `primary` | `#E2EAF2` | 8.77 | 4.5 (text) | The white line: main series |
| `secondary` | `#DCCBA8` | 6.68 | 4.5 (text) | Tea-toned: second series |
| `textMuted` | `#B8CBDE` | 6.41 | 4.5 (text) | Axis labels. A dark substrate leaves room for a value of its own (§3.2) |
| `rule` | `#8AA8C7` | 4.32 | 3.0 (object) | Rules and baseline |
| `grid` | `#8AA8C7` | 4.32 | 3.0 (object) | Grid |
| `heighten` | `#0C2240` | 13.11 vs `primary` | 3.0 (object, vs its outline) | **A reserve** |

**Heightening inverts.** On a light ground the heightened element is white; here white is the
ink, so it is the deepest blue, where the print was left longest in the sun. The rule of §3.3
holds unchanged: its outline is drawn in `primary`, and that outline carries the contrast.

**Weight ramp.** Each level multiplies `--sp-stroke-width` (0.9) for a toned shape's outline:

| Level | `style` | `weight` | Width |
|---|---|---|---|
| 0 | — | — | The shape's own stroke, if any |
| 1 | `weight` | 1.5 | 1.35 |
| 2 | `weight` | 2.25 | 2.03 |
| 3 | `weight` | 3 | 2.7 |
| 4 | `weight` | 4 | 3.6 |

**Inking parameters.** The `WeightInker` redraws nothing by hand, since a contact print has an exact line.
`roughness`, `bowing`, `hatchAngle`, `hatchGap` and `fillWeight` are therefore 0, and
`maxHatchDensity` is 0: there is no hatching to bound. Typography, `emptyState` and
`domainPadding` are those of `silverpoint` (§3.5, §3.6).

### 3.8 The `ui` tokens of a ground

Added to the `Ground` token schema (API Spec §6) as an optional section; a ground without it takes
the defaults below, so grounds registered by consumers keep working (REQ-312).

```ts
readonly ui?: Readonly<{
  /** `'inked'`: build-time pieces as masks (DD-022). `'css'`: an exact border (weight grounds). */
  frame: 'inked' | 'css';
  /** Frame variants generated per kind; 1..6. */
  frameVariants: number;
  /** Control heights in px, per size; each ≥ 24 (REQ-317). */
  controlHeight: Readonly<{ sm: number; md: number; lg: number }>;
  /** Corner radius of the `precision` / `css` frame, px. */
  radius: number;
  /** Focus indicator width, px; ≥ 2 (REQ-316). */
  focusWidth: number;
  /** Tone level per state (DD-026). */
  tone: Readonly<{
    selected: 1 | 2 | 3 | 4;
    primary: 1 | 2 | 3 | 4;
    danger: 1 | 2 | 3 | 4;
    disabled: 1 | 2 | 3 | 4;
    /** The box fill of an Alert of kind `error` (C-3); the other kinds take no tone. */
    alertError: 1 | 2 | 3 | 4;
  }>;
  /** Level of the hatched backdrop behind a modal overlay (feature-004); optional, default 2. */
  backdrop?: 1 | 2 | 3 | 4;
  /** Level of the table's striped and hovered rows (feature-004); optional, default 1. */
  rowTone?: 1 | 2 | 3 | 4;
}>;
```

| Token | `silverpoint` | `cyanotype` | Default (no `ui` section) |
|---|---|---|---|
| `frame` | `inked` | `css` | `css` |
| `frameVariants` | 4 | 1 | 1 |
| `controlHeight` | 24 / 32 / 40 | 24 / 32 / 40 | 24 / 32 / 40 |
| `radius` | 2 (= `--sp-radius`) | 2 | 2 |
| `focusWidth` | 2 | 2 | 2 |
| `tone` | selected 3, primary 2, danger 4, disabled 1, alertError 1 | same (as weights) | same |
| `backdrop` | not declared (2) | not declared (2) | 2 |
| `rowTone` | not declared (1) | not declared (1) | 1 |

*Amended after review (2026-10-19, user decision):* `backdrop` and `rowTone` are optional in
`UiTokens`, and `silverpoint` and `cyanotype` take 2 and 1 as the **defaults** of
`resolveUiTokens` (`UI_TOKEN_DEFAULTS`), without declaring them: a ground written before
feature-004 needs no change (REQ-044, REQ-312). A ground declares `backdrop` or `rowTone` only to
differ from 2 and 1; `resolveUiTokens` rounds them and holds them to `1..4`.

*Amended in implementation:* `backdrop` is the level of the **hatched** backdrop (the
level-2 default of REQ-499); where the backdrop is not hatched —a `weight` ground, `precision`— it is
the opaque substrate, whatever the level. A table's cell holds its text on a `.sp-ui-plate`, so a
toned row's text keeps the contrast `ui.row-tone-text` measures.

**Contrast pairs added to the gate** (REQ-313), on every substrate unless stated; this list is
normative and `tools/contrast-gate` holds it as `UI_CONTRAST_PAIRS`:

| Pair | Foreground | Background | Threshold |
|---|---|---|---|
| `ui.text` | `text` | substrate | 4.5 |
| `ui.frame`, `ui.mark`, `ui.focus` | `primary` (the frame, the exact marks, `--sp-ui-focus-color`) | substrate | 3 |
| `ui.precision-frame` | `rule` | substrate | 3 |
| `ui.tone` | the tone's line: `secondary` under `hatch`, `primary` under `weight` | substrate | 3 |
| `ui.tone-text`, `ui.alert-error-text` | `text` over the level-3 tone, and text on the `alertError` tone (C-3), each on the substrate plate that carries text over a tone | substrate | 4.5 |
| `ui.heighten-outline` | `primary` | `heighten` | 3 (as §3.3) |
| `ui.heighten-text` | `text` | `heighten` | 4.5 |
| `ui.disabled-text` | `textMuted` | substrate | 3 (exempt by WCAG 1.4.3; kept legible) |
| `ui.row-tone-text` | `text` over the `rowTone` tone (on the cell's plate) | substrate | 4.5 |
| `ui.overlay-text` | `text` in an overlay | substrate | 4.5 |
| `ui.option-active` | `text` on the heightened option | `heighten` | 4.5 |
| `ui.option-outline` | `primary` (the active option's outline) | `heighten` | 3 |
| `ui.crumb-separator` | `rule` | substrate | 3 |

The last five are feature-004's (REQ-313, REQ-522), on every substrate of every ground.

Amended in implementation: the token defaults are `UI_TOKEN_DEFAULTS` and a ground's section is completed by `resolveUiTokens` (`@silverpoint/core/ui`); `data-frame` is a slot 0..5 that `ui.css` folds onto the `frameVariants` a ground draws, and `data-tone` a level or a state that it maps to `ui.tone`, so the runtime needs no ground. The gate measured 11 pairs per ground, all passing; with feature-004's five, 16 per ground, all passing.

Text over a tone is never measured against the hatch: it stands on a plate of the substrate, as a
chart label stands on its halo (DD-022).

### 3.9 Palette contrast pairs

`checkPalette` and the contrast gate measure exactly these pairs (`PALETTE_PAIRS`,
`@silverpoint/core/palettes`):

| Pair | Foreground | Background | Threshold |
|---|---|---|---|
| `ink` | `ink` | `substrate` | 4.5 |
| `ink-secondary` | `inkSecondary` | `substrate` | 4.5 |
| `text` | `text` | `substrate` | 4.5 |
| `text-muted` | `textMuted` | `substrate` | 4.5 |
| `rule` | `rule` | `substrate` | 3 |
| `grid` | `grid` | `substrate` | 3 |
| `focus` | `focus` (else `ink`) | `substrate` | 3 |
| `heighten-outline` | `ink` | `heighten` | 3 |
| `heighten-text` | `text` | `heighten` | 4.5 |

A pair is skipped when either colour is unset (and unresolvable) or not hex. A palette without
`substrate` is measured against cream `#EDE7DA` (§2.26).

Amended in implementation: `tools/contrast-gate` audits the six presets × `PALETTE_PAIRS`
(`auditPalette`, `auditPalettes`, part of `auditBuiltins`) with the gate's own ratio, against each
preset's substrate: 54 rows, all passing. A failing preset fails CI with `SP012 … (REQ-464)`, and
the gate agrees with `checkPalette` on altered presets.

## 4. Demo datasets

Each of the 33 charts has a default dataset that is used when it is invoked without
`data` (REQ-093). They live in `packages/core/src/charts/<chart>/demo.ts`, they are frozen
constants and they **form part of the stable surface**: changing them alters the SVG
output of anyone who invokes without data, and by the rule of API Spec §13 that is never
a `patch`.

The activity grid is the only generated dataset, and it is pinned on both axes of
non-determinism. It is generated with a fixed seed by default, which pins the counts, and
**its end date is pinned to the constant `2026-06-30`**, which pins the dates. The seed
alone was not enough: the dates were derived from `today`, so the dataset changed every
day and differed between server and client timezones — a hydration mismatch waiting for
midnight. `today` is used only when the consumer supplies their own data. Passing
`seed: null` restores the random behaviour, at the cost of breaking hydration. This closes
Analyze finding A-02 against REQ-005 and REQ-103.

Under the demo, a chart ignores its accessor props and applies every other own prop (REQ-098):
`VolvelleChart`'s `indexRing` and `indexValue` turn the demo's rings (`Day`, `Shift`, `Team`)
exactly as they turn a consumer's.

**Second catalog** (feature-003). 27 new frozen constants in `packages/core/src/charts/<chart>/demo.ts`, **synthetic and original**
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
| Treemap, sunburst, tree | 3 levels below the root, 38 nodes, 24 leaves at two depths (a fictional budget) | Squarify, more categories than levels, paths, leaves at mixed depths |
| Parallel coordinates | 30 rows × 5 dimensions | Mixed domains |
| Polar line | 12 monthly values, `period: 12` | Closing the line |
| Polar scatter | 150 points, angle in degrees | Wrap at 360 |
| Density bins, contours (points) | 1 200 points from two overlapping clusters | Hex bins, density levels |
| Contours (grid) | 40 × 30 grid of a smooth synthetic surface, printed as its values row by row (positions implied) | Filled bands, holes |
| Delaunay | 60 points | Triangulation, convex hull |
| Vector field | 20 × 14 grid, a vortex | Arrow scaling |
| Network | 40 nodes in 4 groups, 90 links | Layout, degree, four groups toned by `ringTone` with a legend (DD-032) |

Datasets shared by several charts live in one demo and are re-exported (histogram · ECDF ·
beeswarm; box · violin · ridgeline; dumbbell · slope; treemap · sunburst · tree; density bins ·
contours). With the demo, `nodes` (network) and `levels` (diverging bars, contours) are ignored, as
data (REQ-098).

**Reference dashboards.** Frozen, like every demo dataset, and used by the fixtures, the example apps and the docs site.

| Name | Cells | Purpose |
|---|---|---|
| `kpi-strip` | 4 × `KpiCard` + 1 `LineChart` spanning `lg 4 / md 2` | The most common shape: a strip of numbers over a trend |
| `ops` | 12 cards: 4 KPI, `LineChart` (col 3, row 2), `BarChart`, `HeatmapChart` (col 2), `DonutChart`, `SparklineRows`, `ActivityGrid` (col 2), `GaugeArc` | The DD-007 weight reference; linked on `hour` across line, bar and heatmap |
| `mixed-spans` | 7 cells with spans chosen to leave a row-end gap at `md` | Proves REQ-203: gap left, no reordering |

All charts render their demo data (REQ-093), so no dashboard fixture carries consumer data.


**UI demos.** Frozen, like every demo dataset, and used by the fixtures, the example apps and the docs site:
`UI_DEMOS` in `packages/core/src/ui/demo.ts` (exported from the subpath `@silverpoint/core/ui-demos`, to keep the core's full bundle under 45 kB), one entry per component with its props per state
(§5), plain data, deep-frozen (I-9 extended).

The UI page composes as the concept drawing does: its Card holds a KPI and a Sparkline chart (C-5).
The Card fixtures hold no chart: text content only, so a component fixture tests the component and
the chart keeps its own fixtures and gates.

**Composed components, overlays, palettes and the timeline** (feature-004). `UI_DEMOS` gains one
entry per new state (§5), plain data, deep-frozen. The composed page composes as the Reflex
`/components` page does: a table of orders with sorting and pagination, a statistic row,
descriptions of the selected order, a timeline list of its history, a collapse of FAQs, the empty
and result states, and one trigger per overlay. The palettes page shows the six presets, each over a
`LineChart`, an `SpCard` with an `SpProgress`, and an `SpTable`. The timeline page holds a frozen
`TIMELINE_DEMO` (TimelineJS JSON: the life of a silverpoint drawing, eight events, two eras, no
external media).

*Amended in implementation:*

- `UI_DEMOS` holds the 35 states of the 21 new catalog rows (80 states in all); the Timeline's
  `surface` state is its own fixture set, not a catalog row (§5). Overlays are demoed `open`, with
  `trigger` the text of their trigger button; `glyph--all` lists `UI_GLYPHS`; the sorted table's
  rows are sorted by `uiSortRows`, as a consumer would (DD-040).
- `TIMELINE_DEMO` is exported from `@silverpoint/core/ui-demos`, beside `UI_DEMOS`, not from
  `/timeline`, which would ship demo data to applications (REQ-330). TimelineJS writes `unique_id`
  into its data, so `timelineMount` builds it on a `structuredClone` of the frozen demo.
- The pages are `/composed`, `/palettes` and `/timeline` in the four example apps, their content
  in the shared harness (`COMPOSED_PAGE`, `PALETTES_PAGE`, `TIMELINE_PAGE`). The composed page's
  overlays are closed behind their triggers with no active item, its items are uncontrolled, and
  each panel has its own toaster.


## 5. The fixture matrix

The unit the Art. 3 gates compare. It lives versioned in `fixtures/`.

```ts
interface Fixture {
  /** Stable identifier; it is the file name of the golden image. */
  id: string;              // "line-chart--silverpoint--cream--ink--md"
  chart: string;           // "LineChart"
  req: string;             // "REQ-060" — traceability to the PRD
  ground: string;
  substrate: string;
  mode: 'ink' | 'precision';
  hatchFill: 'tile' | 'per-shape';
  seed: number;
  size: { width: number; height: number };
  props: Record<string, unknown>;
  /** Path to a JSON data file, or `null` to use the demo dataset. */
  data: string | null;
  /** A state fixture's name (the catalog row's `states`), suffixing the id `--<state>`. */
  state?: string;
  /**
   * Path to the canonical normalised SVG. Every adapter is compared against this file,
   * never against a sibling adapter, so a third framework costs one comparison and a
   * failure names the guilty adapter (Art. 3, DD-004).
   */
  canonical: string;
}
```

**Coverage.** Chart fixtures iterate the catalog: the 60 charts and three **state fixtures** —
`SquarifiedTreemap` and `SunburstChart` with `rootId` on a second-level node (`root`), and
`NetworkChart` at consumer positions (`placed`, REQ-436), which the demo cannot show. On every PR:
the 63 × the 2 modes × size `md` × `tile`, over every ground and substrate —`silverpoint`'s four and
`cyanotype` × `prussian`— = **630 fixtures**; the full matrix runs on every PR, the second catalog
included (OQ-C4). Nightly, the full product: `silverpoint` with its four substrates, the two values
of `hatchFill` and three sizes (3,024), plus `cyanotype` with its one substrate and three sizes,
`tile` only (378): `hatchFill` has no effect under `weight`. **3,402 fixtures.**

| Size | Dimensions | Why |
|---|---|---|
| `sm` | 240 × 120 | Compact card |
| `md` | 320 × 150 | Reference |
| `lg` | 640 × 300 | Where the path budget pinches hardest |

**Dashboard fixtures** (Constitution Art. 3, "chart or composition"). Same `Fixture` shape, with
`chart` naming the reference dashboard and `size` the container width.

| Axis | Values | Count |
|---|---|---|
| Dashboard | `kpi-strip`, `ops`, `mixed-spans` | 3 |
| Ground × substrate | the four of `silverpoint`, plus `cyanotype` × `prussian` | 5 |
| Mode | `ink`, `precision` | 2 |
| Breakpoint width | 375, 800, 1280 px | 3 |

**90 dashboard fixtures**, beside the 3,402 chart fixtures. The parity (string/tree) gate uses the
nominal render at `ssrWidth` 1280 — one per dashboard × substrate × mode, **30** — because the
markup does not depend on the container width; the pixel gates use all 90.


**UI component fixtures** (feature-002). Same `Fixture` shape; `chart` names the component, `props` the state, `size` the harness width.

**Declared states** (45):

| Component | States | # |
|---|---|---|
| Button | default, primary, danger, disabled | 4 |
| Input | empty (placeholder), filled, invalid with `message`, disabled | 4 |
| Checkbox | unchecked, checked, indeterminate, disabled | 4 |
| RadioGroup | selected, with a disabled item | 2 |
| Switch | off, on, disabled | 3 |
| Slider | value 30 with marks, disabled | 2 |
| Rate | 3 of 5, read-only | 2 |
| Segmented | first selected, middle selected | 2 |
| Tabs | first active, with a disabled tab | 2 |
| Steps | current 2 of 4, with an error step | 2 |
| Card | plain, with title and extra (text content only, no chart) | 2 |
| Tag | tone 1, closable tone 3 | 2 |
| Badge | count, dot, overflow (`99+`) | 3 |
| Divider | plain, with text | 2 |
| Progress | line 40, circle 72, indeterminate | 3 |
| Alert | info, success, warning, error | 4 |
| Skeleton | paragraph, with avatar | 2 |

| Axis | Values | Count |
|---|---|---|
| Component state | the table above | 45 |
| Ground × substrate | the four of `silverpoint`, plus `cyanotype` × `prussian` | 5 |
| Mode | `ink`, `precision` | 2 |
| Size | `md`; plus `sm` and `lg` for Button, Input and Segmented in their first state (nightly) | — |

**Nightly: 450 state fixtures + 60 size fixtures = 510.** **On every PR: 180** — the 45 states × 2
modes × `silverpoint/cream` and `cyanotype/prussian`. Harness width 320 px, 640 px for Card and
Alert. With feature-004's fixtures (below), the totals are 3,402 chart + 90 dashboard + 906
component and palette fixtures nightly.

**Composed, overlay and timeline fixtures** (feature-004). The same axes as feature-002's (five
ground × substrate, two modes; `md`).

| Component | States | # |
|---|---|---|
| Surface | frame-card, tone-2 | 2 |
| Glyph | all (the 17 glyphs in a row) | 1 |
| Table | plain, sorted-striped, empty | 3 |
| Pagination | middle (both gaps), total (first page, `showTotal`) | 2 |
| Breadcrumb | three | 1 |
| Avatar | initials, square, group | 3 |
| Statistic | plain, trend-down | 2 |
| Descriptions | bordered, plain | 2 |
| TimelineList | mixed (done, current, pending, error) | 1 |
| Collapse | one-open, accordion-disabled | 2 |
| Empty | plain | 1 |
| Result | success, error | 2 |
| Textarea | count, invalid | 2 |
| InputNumber | value, at-min | 2 |
| Modal | open | 1 |
| Drawer | end-open | 1 |
| Popover | open | 1 |
| Tooltip | open | 1 |
| Select | placeholder, open-selected | 2 |
| DropdownMenu | open | 1 |
| Toast | info, error-action | 2 |
| Timeline | surface (server markup only) | 1 |

**36 states**: **360 nightly**, **144 on every PR** (`silverpoint/cream` and
`cyanotype/prussian`). **Palette fixtures:** six presets × three targets (`LineChart`, `SpCard`,
`SpTable`) × two modes on `silverpoint/cream` = **36, nightly and PR**,
`palette--<preset>--<target>--<mode>`. The timeline's pixel fixture (one, TimelineJS pinned) is
nightly only.

*Amended in implementation:*

- The 35 catalog states are the component matrix's: **350** new UI fixtures (**140** on PR), so the
  matrix holds **860** (**320** on PR) in `fixtures/ui`. The Timeline's 10 `surface` fixtures,
  `timeline--surface--<ground>--<substrate>--<mode>` (4 on PR), are written beside the matrix
  (`fixtures/timeline`, by `timeline-canonical`, `tools/visual-gate/timeline-fixtures.ts`; their
  canonicals in `fixtures/ui`), as the palette fixtures are (`fixtures/palette`, by
  `palette-canonical`), since `SpTimeline` has no `ui/` subpath; each adapter compares its server
  markup with them, and `timeline-gate.ts` compares them over the published builds. With the
  matrix's 350 and 140 they make the 360 and 144 above.
- Component fixtures: **870 nightly, 324 on PR** (860 + 10, 320 + 4); with the 36 palette
  fixtures, **906 nightly, 360 on PR**. Totals: 3,402 chart + 90 dashboard + 906 component and
  palette fixtures nightly; 630 chart + 30 dashboard + 360 component and palette fixtures on PR.
- A palette fixture is the card's `titled` state, the table's `plain` state and the committed `md`
  `LineChart` cell, with the preset added; a UI fixture may name a `palette`, resolved through
  `PALETTES` (an unknown name is an error). The palette gate compares each adapter's tree with the
  canonical's, the `<svg>`'s `style` set aside (a chart's palette is on the adapter's `.sp-root`,
  on the `<svg>` in `toSVGString`), then the two styles as sorted declarations (I-33).
- Harness width 640 px for Card, Alert, Table, Descriptions, TimelineList, Collapse and Result;
  320 px for the rest (DD-043). The composed demos (Glyph `all`, Avatar `group`, Collapse) are
  serialised piece by piece; an open overlay is shot as the 800 × 600 viewport, once open, placed
  and focused.
- The timeline's nightly pixel fixture is `timeline/timeline--page.png`, one golden for the four
  example apps.


## 6. Invariants

Verifiable, and each one with its test.

| # | Invariant | Requirement |
|---|---|---|
| I-1 | Every emitted coordinate has at most 2 decimals | REQ-002 |
| I-2 | The vertices of the `role='encoding'` strokes are identical between `ink` and `precision` | REQ-006 |
| I-3 | No `Stroke` carries colour; colour only enters through CSS via `part` | REQ-042 |
| I-4 | At most one element per chart carries `part='sp-heighten'` | REQ-024 |
| I-5 | Every element with `part='sp-heighten'` has an outline with `part='sp-ink'` | §3.3 |
| I-6 | Every generated `id` is scoped to the chart instance | REQ-030 |
| I-7 | Every ink of every registered ground meets its contrast threshold | REQ-126 |
| I-8 | `Geometry` is serializable to JSON without loss | REQ-011 |
| I-9 | The demo datasets are frozen at runtime | §4 |
| I-10 | `resolveDashboard` is pure: the same props and child ids give a deep-equal model; the model is JSON-serialisable. | REQ-011, REQ-201 |
| I-11 | `model.cells` is in reading order, and the adapter emits the cells in exactly that order. | REQ-203 |
| I-12 | For every cell and breakpoint, `1 ≤ span.col ≤ columns[bp]`. | REQ-204 |
| I-13 | Every cell in the same row of the `lg` nominal layout, with equal `rowSpan`, gets the same outer height. | REQ-206 |
| I-14 | No two resolved cells share a `chartId`. | REQ-209 |
| I-15 | A dashboard's server render contains no `part="linked"`. | REQ-219 |
| I-16 | Under a `weight` ground, a chart emits no `data-role="hatch"` and no `<pattern>`, and every `data-weight` is 1-4. | REQ-028 |
| I-17 | For every component state, the layout box of every element and every `--sp-ui-fraction` are equal in `ink` and `precision`. | REQ-306 |
| I-18 | At most one element per component instance carries `part="sp-heighten"`, and it has an ink outline. | REQ-309 |
| I-19 | `ui.css` contains no literal colour: every `color`, `background`, `border-color` and `fill` value is a `var(--sp-…)` or `currentColor`, `transparent`, or a system colour inside `@media (forced-colors: active)`. | REQ-305 |
| I-20 | Every interactive element of every fixture measures at least 24 × 24 CSS px. | REQ-317 |
| I-21 | `uiFrameVariant` is pure and returns an integer in `0..frameVariants − 1`; with neither `seed` nor `id` it returns `0`. | REQ-307 |
| I-22 | Every fraction is in `[0, 1]` with at most 2 decimals. | REQ-002, REQ-324 |
| I-23 | Statistics are pure and order-independent: shuffling `data` yields deep-equal derived values and, apart from the tabular alternative's row order, an identical model | REQ-430, REQ-432 |
| I-24 | Bin counts sum to the number of finite observations; ECDF is non-decreasing and ends at 1; `min ≤ q1 ≤ median ≤ q3 ≤ max` | REQ-400..REQ-402 |
| I-25 | Hierarchy: every drawn node's value equals the sum of its drawn children (leaves: their own); treemap tile and sunburst arc measures are proportional to value within 2-decimal rounding | REQ-416, REQ-417, REQ-437 |
| I-26 | Waffle: cells across categories sum exactly to `cells`; a category with a positive value gets ≥ 1 cell when `cells ≥` the number of categories | REQ-414 |
| I-27 | Iterative layouts: the geometry is byte-identical in Node, Chromium, Firefox and WebKit for the same seed | REQ-435 |
| I-28 | No two points of a beeswarm overlap: centre distance ≥ `2 × radius − 0.01` | REQ-405 |
| I-29 | Every category of a chart is reachable by keyboard and present in the tabular alternative, whether or not it has a direct label | REQ-440 |
| I-30 | A chart with `rootId` renders identically on the server and the client; no adapter holds root state | REQ-439 |
| I-31 | The six palette presets are deep-frozen and every one passes every pair of §3.9. | REQ-463, REQ-464 |
| I-32 | No rule of `ui.css` or `timeline.css` sets `opacity`, `color-mix(… transparent)` or a gradient on a tone, a row, a backdrop or a highlight. | REQ-475, REQ-499 |
| I-33 | A palette changes only the root's `style`: the tree of a fixture with a palette equals the tree without it except for that attribute (a chart's adapter `.sp-root`, or the `<svg>` of `toSVGString`). | REQ-468 |
| I-34 | `uiSortRows` is stable and total: for any rows and key, the output is a permutation of the input with nulls last. | REQ-474 |
| I-35 | `uiPlace` keeps the overlay inside the viewport minus `padding` whenever it fits, and its output has at most 2 decimals. | REQ-493 |
| I-36 | At most one element per open list overlay is heightened, and it is the `aria-activedescendant` of the Select or the focused item of the Menu. | REQ-498 |
| I-37 | Every chart and component exported by any adapter has exactly one catalog entry, and vice versa. | REQ-536 |
| I-38 | Every `PropEntry` of a chart or component equals the props reference's entry for it (name, type, optional, doc); only `default` and `reflex` are added. | REQ-530 |
| I-39 | `catalog.version` equals the version of `@silverpoint/mcp` and of the core it ships with. | REQ-550 |
| I-40 | `reflex.stale` is `reflex.wraps !== version`; a release build requires `false` when the pin is the wrapper's own export; with a derived pin (`derived` set) a stale catalog warns (amended in implementation, user decision 2026-10-20). | REQ-556 |
| I-41 | Every `DataSpec.fields[].prop` is a prop of that chart. | REQ-541 |
| I-42 | Every slug a rule names exists in `charts`. | REQ-540 |

Feature-004's delta numbered I-31..I-36 as I-23..I-28, which feature-003's fold had already taken;
they are renumbered here, and the feature-004 tests that cite them by the delta's number (palette,
`ui.css`, `timeline.css`, sort, placement, overlay) read as I-31..I-36.

---

## Change History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-09-13 | Ernesto Crespo | Initial version. Palette adjusted after verifying contrast: the original seed failed on `rule`, `textMuted` and `heighten` |
| 1.3 | 2026-09-13 | Ernesto Crespo | `Fixture` gains `canonical`, the reference render every adapter is compared against, after Vue made pairwise comparison untenable |
| 1.2 | 2026-09-13 | Ernesto Crespo | Sibling version references realigned after the Vite integration change; no content change |
| 1.5 | 2026-09-26 | Ernesto Crespo | Delta-012: §3.7 the `cyanotype` ground (one substrate, verified inks, inverted heightening, weight ramp); §5 matrix gains `cyanotype` (1,782 chart fixtures, 330 on PR; 90 dashboard fixtures); I-16 |
| 1.6 | 2026-09-29 | Ernesto Crespo | Feature-002 folded: component value contracts §2.14, the `ui` tokens and UI contrast pairs §3.8, UI demos in §4, 510 component fixtures in §5, invariants I-17..I-22 |
| 1.7 | 2026-10-10 | Ernesto Crespo | Feature-003 folded: input shapes §2.15..§2.24, derived items and keyboard moves §2.25, "Used by" of §2.1, §2.2, §2.7; the 27 demos in §4; state fixtures and 3,402 chart fixtures (630 on PR) in §5; invariants I-23..I-30 |
| 1.9 | 2026-10-20 | Ernesto Crespo | Feature-005 folded: the agent catalog §2.28, chart metadata §2.29 (the nine families as built), the Reflex catalog §2.30, the recommender rules §2.31, invariants I-37..I-42. What the implementation changed is folded as built ("amended in implementation") |
| 1.8 | 2026-10-20 | Ernesto Crespo | Feature-004 folded: the `Palette` contract and its six presets §2.26; value contracts, sort order and page window of the composed components §2.27; `ui` tokens `backdrop` and `rowTone` (optional, defaults 2 and 1, declared by neither built-in ground) and five UI contrast pairs §3.8; palette contrast pairs §3.9; composed, palettes and timeline demos in §4; 36 states (860 UI matrix fixtures, 320 on PR; 10 timeline surface fixtures, 4 on PR) and 36 palette fixtures in §5 (906 nightly, 360 on PR); invariants I-31..I-36 (I-23..I-28 in the delta). What the implementation changed is folded as built ("amended in implementation") |
| 1.4 | 2026-09-25 | Ernesto Crespo | Deltas folded: `columnLabels` on the heatmap (006); `SparklineRows` shape §2.11 (008); how the orbit props read §2.10 (009); `VolvelleData` §2.12 (010); view props apply to the demo (011). Dashboard: layout contract §2.13, reference dashboards in §4, 72 dashboard fixtures in §5, invariants I-10..I-15 (feature-001) |
| 1.1 | 2026-09-13 | Ernesto Crespo | Converted to English; demo activity-grid dataset pinned to a fixed end date (Analyze finding A-02); "input shape" replaces the overloaded "geometric family" (finding A-11) |

## Constitution check

- **Art. 5** — §3.2 verifies the thresholds numerically and §3.3 resolves the heightening
  case without giving it up; I-7 turns it into a gate.
- **Art. 6** — §3.4 defines the tonal mechanism as density and angle, with the tile as its
  support.
- **Art. 7** — everything in §3 is declarative; no value lives in the code of a chart.
- **Art. 4** — §4 pins the seed and the end date of the only generated dataset, so that
  hydration is not broken.
- **Art. 3** (v1.5) — §5 adds the dashboard compositions to the declared matrix.
- **Art. 5** (v1.7) — the UI contrast pairs of §3.8 join the gate; I-20 makes target size an invariant.
- **Art. 7** — `ui` is a token section (§3.8); a consumer ground without it still renders.
- **Art. 1 / Art. 2** (feature-003) — every derived value of §2.15..§2.25 is computed by the core
  and drawn as encoding; the contracts say which values are ignored (an internal node's `value`).
- **Art. 3 / Art. 4** (feature-003) — the demos are literals (§4); I-23 and I-27 make order and
  engine irrelevant; the state fixtures join the declared matrix.
- **Art. 5** (feature-003) — I-29: identity and reachability do not depend on what fits on screen.
- **Art. 4** (feature-004) — fixtures carry ids; sort (I-34) and placement (I-35) are pure;
  presets frozen (I-31); a paused toast restarts its duration rather than read a clock.
- **Art. 5** (feature-004) — the contrast pairs extend to overlays, rows and palettes (§3.8, §3.9).
- **Art. 6** (feature-004) — I-32 forbids opacity and gradients as tone; the backdrop and the
  toned rows are the ground's ramp.
- **Art. 7** (feature-004) — `backdrop` and `rowTone` are ground tokens; presets are data.
- **Exception requested:** none. The heightening is **not** an exception to Art. 5: it
  complies by outline, not by dispensation.
