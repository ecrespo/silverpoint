# silverpoint — Data Model Specification

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **Version** | 1.3 |
| **Date** | 2026-09-13 |
| **Storage** | None — there is no database |
| **Related Tech Design** | [`technical-design.md`](technical-design.md) v1.4 |
| **Related API Spec** | [`api-spec.md`](api-spec.md) v1.5 |

> **Template adaptation note.** The template assumes persisted collections. silverpoint
> stores nothing: its «entities» are three families of in-memory data —the input
> contracts each chart consumes, the tokens of each ground, and the fixture matrix that
> feeds the Art. 3 gates—. Indexes, migrations and retention do not apply and are omitted.

---

## 1. Model Overview

```
        ┌──────────────────┐
        │  Input contract  │   what the consumer passes in `data`
        │  (§2)            │   10 input shapes for the 33 charts
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

Ten input shapes cover the 33 charts. The field names are the **defaults**: all of them
are redefined with the `*Key` accessors of API Spec §7.

### 2.1 `CategorySeries` — 15 cartesian charts

```ts
type CategorySeries = ReadonlyArray<{
  [xKey: string]: string | number;   // category or numeric value of the axis
  [valueKey: string]: number | null; // one or more series
}>;
```
Used by: line, step chart, area, bars, stacked bars, composed, stream, waterfall, funnel,
scatter, bubble, sparkline rows, KPI card, range band, coxcomb.

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

**Coverage.** On every PR: the 33 charts × the 2 modes × ground `silverpoint` × substrate
`cream` × size `md` = **66 fixtures**. Nightly, the full product with the four substrates,
the two values of `hatchFill` and three sizes = **1,584 fixtures**.

| Size | Dimensions | Why |
|---|---|---|
| `sm` | 240 × 120 | Compact card |
| `md` | 320 × 150 | Reference |
| `lg` | 640 × 300 | Where the path budget pinches hardest |

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

---

## Change History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-09-13 | Ernesto Crespo | Initial version. Palette adjusted after verifying contrast: the original seed failed on `rule`, `textMuted` and `heighten` |
| 1.3 | 2026-09-13 | Ernesto Crespo | `Fixture` gains `canonical`, the reference render every adapter is compared against, after Vue made pairwise comparison untenable |
| 1.2 | 2026-09-13 | Ernesto Crespo | Sibling version references realigned after the Vite integration change; no content change |
| 1.1 | 2026-09-13 | Ernesto Crespo | Converted to English; demo activity-grid dataset pinned to a fixed end date (Analyze finding A-02); "input shape" replaces the overloaded "geometric family" (finding A-11) |

## Constitution check

- **Art. 5** — §3.2 verifies the thresholds numerically and §3.3 resolves the heightening
  case without giving it up; I-7 turns it into a gate.
- **Art. 6** — §3.4 defines the tonal mechanism as density and angle, with the tile as its
  support.
- **Art. 7** — everything in §3 is declarative; no value lives in the code of a chart.
- **Art. 4** — §4 pins the seed and the end date of the only generated dataset, so that
  hydration is not broken.
- **Exception requested:** none. The heightening is **not** an exception to Art. 5: it
  complies by outline, not by dispensation.
