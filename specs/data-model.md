# silverpoint — Data Model Specification

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **Version** | 1.5 |
| **Date** | 2026-09-26 |
| **Storage** | None — there is no database |
| **Related Tech Design** | [`technical-design.md`](technical-design.md) v1.7 |
| **Related API Spec** | [`api-spec.md`](api-spec.md) v1.8 |

> **Template adaptation note.** The template assumes persisted collections. silverpoint
> stores nothing: its «entities» are three families of in-memory data —the input
> contracts each chart consumes, the tokens of each ground, and the fixture matrix that
> feeds the Art. 3 gates—. Indexes, migrations and retention do not apply and are omitted.

---

## 1. Model Overview

```
        ┌──────────────────┐
        │  Input contract  │   what the consumer passes in `data`
        │  (§2)            │   12 input shapes for the 33 charts; §2.13 for the dashboard layout
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

Twelve input shapes cover the 33 charts, and a thirteenth contract (§2.13) describes the dashboard
layout. The field names are the **defaults**: all of them
are redefined with the `*Key` accessors of API Spec §7.

### 2.1 `CategorySeries` — 14 cartesian charts

```ts
type CategorySeries = ReadonlyArray<{
  [xKey: string]: string | number;   // category or numeric value of the axis
  [valueKey: string]: number | null; // one or more series
}>;
```
Used by: line, step chart, area, bars, stacked bars, composed, stream, waterfall, funnel,
scatter, bubble, KPI card, range band, coxcomb. Sparkline rows have their own shape (§2.11).

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
Used by: donut, polar bars, radial arc group, radial rings, radar, coxcomb, wind rose.

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
12 categories, `SP010`.

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

**Reference dashboards.** Frozen, like every demo dataset, and used by the fixtures, the example apps and the docs site.

| Name | Cells | Purpose |
|---|---|---|
| `kpi-strip` | 4 × `KpiCard` + 1 `LineChart` spanning `lg 4 / md 2` | The most common shape: a strip of numbers over a trend |
| `ops` | 12 cards: 4 KPI, `LineChart` (col 3, row 2), `BarChart`, `HeatmapChart` (col 2), `DonutChart`, `SparklineRows`, `ActivityGrid` (col 2), `GaugeArc` | The DD-007 weight reference; linked on `hour` across line, bar and heatmap |
| `mixed-spans` | 7 cells with spans chosen to leave a row-end gap at `md` | Proves REQ-203: gap left, no reordering |

All charts render their demo data (REQ-093), so no dashboard fixture carries consumer data.


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
  /**
   * Path to the canonical normalised SVG. Every adapter is compared against this file,
   * never against a sibling adapter, so a third framework costs one comparison and a
   * failure names the guilty adapter (Art. 3, DD-004).
   */
  canonical: string;
}
```

**Coverage.** On every PR: the 33 charts × the 2 modes × size `md` × `tile`, over every ground
and substrate —`silverpoint`'s four and `cyanotype` × `prussian`— = **330 fixtures**. Nightly, the full product: `silverpoint` with its four substrates, the two
values of `hatchFill` and three sizes (1,584), plus `cyanotype` with its one substrate and three
sizes, `tile` only (198): `hatchFill` has no effect under `weight`. **1,782 fixtures.**

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

**90 dashboard fixtures**, beside the 1,782 chart fixtures. The parity (string/tree) gate uses the
nominal render at `ssrWidth` 1280 — one per dashboard × substrate × mode, **30** — because the
markup does not depend on the container width; the pixel gates use all 90.


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

---

## Change History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-09-13 | Ernesto Crespo | Initial version. Palette adjusted after verifying contrast: the original seed failed on `rule`, `textMuted` and `heighten` |
| 1.3 | 2026-09-13 | Ernesto Crespo | `Fixture` gains `canonical`, the reference render every adapter is compared against, after Vue made pairwise comparison untenable |
| 1.2 | 2026-09-13 | Ernesto Crespo | Sibling version references realigned after the Vite integration change; no content change |
| 1.5 | 2026-09-26 | Ernesto Crespo | Delta-012: §3.7 the `cyanotype` ground (one substrate, verified inks, inverted heightening, weight ramp); §5 matrix gains `cyanotype` (1,782 chart fixtures, 330 on PR; 90 dashboard fixtures); I-16 |
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
- **Exception requested:** none. The heightening is **not** an exception to Art. 5: it
  complies by outline, not by dispensation.
