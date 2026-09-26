# silverpoint — API Specification

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **API version** | v1.6 |
| **Date** | 2026-09-25 |
| **Related PRD** | [`prd.md`](prd.md) v1.8 |
| **Applicable Constitution** | [`constitution.md`](constitution.md) v1.5 |
| **Surface** | npm packages — there is no network API |

---

## 0. Template adaptation note

The API Spec template assumes an HTTP service. silverpoint is a client library, so each
section is carried over to its equivalent and the correspondence is written down here, so
that the Analyze gate does not read it as an omission:

| Original section | Equivalent here |
|---|---|
| Base URL | Packages and *entry points* (§1) |
| Authentication and roles | Not applicable — replaced by public versus internal surface (§2) |
| Response format | Shared types and naming conventions (§3, §4) |
| Error codes | Catalog of errors and warnings with a stable code (§11) |
| Endpoints | Components and their props (§5 through §8) |
| Pagination | Not applicable |
| Webhooks | Events and interaction (§9) |
| Rate limiting | Limits and budgets (§12) |
| Versioning | SemVer and deprecation policy (§13) |

## 1. Packages and entry points

| Package | Contents | Dependencies |
|---|---|---|
| `@silverpoint/core` | Geometry, scales, interaction, the `Inker` interface, types | `d3-scale`, `d3-shape` and the ribbon generator (§8.4) |
| `@silverpoint/grounds` | Declarative style tokens and the `styles.css` sheet | `@silverpoint/core` |
| `@silverpoint/react` | React components | `peer`: `react`, `react-dom` |
| `@silverpoint/angular` | Standalone components, in Angular Package Format | `peer`: `@angular/core`, `@angular/common` |
| `@silverpoint/vue` | Vue 3 components authored with `<script setup>` | `peer`: `vue` |
| `@silverpoint/fonts` | **Optional.** Self-hosted EB Garamond (400, 500 and 400 italic) plus its `@font-face` rules | none |

Every chart is importable by subpath, so that an app using one does not drag in all 33
(REQ-107):

```ts
import { LineChart } from '@silverpoint/react';            // barrel
import { LineChart } from '@silverpoint/react/line-chart';  // subpath
import '@silverpoint/grounds/styles.css';                   // once only, in the app
```

The dashboard composition (§7.1) follows the same rule, under a `dashboard` subpath in each
adapter: `@silverpoint/react/dashboard` (and `/server/dashboard`), `@silverpoint/vue/dashboard`,
`@silverpoint/angular/dashboard`. It ships inside the existing packages; there is no dashboard
package.

### 1.1 Consuming under a bundler

The three frameworks are React, Angular and Vue. The bundlers that host them are validated
separately, because that is where package resolution actually breaks. Vite is the default
host for both the React and the Vue example apps, and runs underneath the Angular CLI.

| Host | Guarantee | Requirement |
|---|---|---|
| Vite | Every subpath resolves identically in the dev server and in the production build, with no `optimizeDeps` entry required | REQ-033 |
| Vite, Next.js, any bundler | The stylesheet import survives tree-shaking: packages declare `sideEffects: false` **except** for `.css`, so `import '@silverpoint/grounds/styles.css'` is never dropped | REQ-034 |
| Next.js | Server-rendered markup hydrates with no mismatch | REQ-103 |

If a consumer ever needs an `optimizeDeps.include` entry to make an import work, that is a
defect in this package, not a configuration step for them to discover.

In Angular the subpath is a secondary entry point per APF:

```ts
import { SpLineChart } from '@silverpoint/angular/line-chart';
```

In Vue the subpath mirrors React's:

```ts
import { SpLineChart } from '@silverpoint/vue/line-chart';
```

## 2. Public versus internal surface

**Public** —subject to SemVer—: component names and selectors, props and inputs, the
types exported in §3, the ground token schema (§6), the CSS custom properties of §10, the
error codes of §11 and the subpath names.

**Internal** —may change in a minor version—: the shape of the `Geometry` objects the core
returns, the implementation of each `Inker`, the structure of the SVG DOM except for the
`part` attributes documented in §10, and any symbol exported under the `__` prefix.

THE SYSTEM marks internals with `@internal` in TSDoc and excludes them from the public
`.d.ts`.

## 3. Shared types

```ts
/** A row of data. Charts reach its fields through accessors. */
export type Datum = Readonly<Record<string, unknown>>;

/** Access to a field: key name or pure function. */
export type Accessor<T = number> = string | ((d: Datum, i: number) => T);

/** Inking mode. `precision` amounts to using NullInker (REQ-021). */
export type InkMode = 'ink' | 'precision';

/** Seed. A string is converted to an integer stably (REQ-003). */
export type Seed = number | string;

/** Name of a registered ground, or a complete ground. */
export type GroundRef = GroundName | Ground;

/** Prepared substrates of the silverpoint ground (REQ-046). */
export type SubstrateName = 'cream' | 'green' | 'blue' | 'ochre';

/** Active item resolved by the interaction engine (REQ-140). */
export interface ActiveItem {
  readonly seriesKey: string;
  readonly index: number;
  readonly datum: Datum;
  readonly value: number;
  /** Coordinates in SVG space, not screen space. */
  readonly point: Readonly<{ x: number; y: number }>;
}
```

### 3.1 Geometry output

```ts
/** Stroke instruction. It carries no color: color comes from CSS (REQ-042). */
export interface Stroke {
  /** SVG path data, already rounded to 2 decimals (REQ-002). */
  readonly d: string;
  /** What this stroke is. Determines whether the Inker may touch it (REQ-022). */
  readonly role: 'encoding' | 'ornament' | 'hatch';
  /** Semantic paint slot; maps to a CSS variable in §10. */
  readonly part: StrokePart;
  /** Relative weight, resolved against the ground's token. */
  readonly weight?: number;
}

export type StrokePart =
  | 'ink' | 'ink-secondary' | 'heighten' | 'rule' | 'grid' | 'axis';

/** Everything a chart needs in order to draw itself. Serializable (REQ-011). */
export interface Geometry {
  readonly viewBox: Readonly<{ x: number; y: number; width: number; height: number }>;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
  readonly hitAreas: readonly HitArea[];
}
```

> **Design decision.** `Stroke` carries no color as a direct consequence of Art. 8: since
> theming goes through CSS custom properties and in SVG `stroke="var(--x)"` does **not**
> resolve as a presentation attribute, color is applied by CSS from the `part` attribute.
> The `Inker` emits shape, never paint.

### 3.2 The `Inker` interface

```ts
export interface Inker {
  readonly name: string;
  /** Receives exact geometry and returns the inked geometry. */
  ink(geometry: Geometry, options: InkOptions): Geometry;
}

export interface InkOptions {
  readonly seed: number;
  readonly roughness: number;
  readonly bowing: number;
  readonly hatchAngle: number;
  readonly hatchGap: number;
  readonly fillWeight: number;
  /** Upper bound of nodes the Inker must not exceed. */
  readonly nodeBudget: number;
}

/** Returns the geometry untouched. `precision` mode is exactly this. */
export declare const NullInker: Inker;
```

An `Inker` SHALL honour two invariants, verified by test: it does not alter any `Stroke`
whose `role` is `'encoding'` beyond its intermediate path —the endpoints are preserved—
and it does not emit a `part` different from the one it received.

## 4. Naming conventions

| Scope | Convention | Example |
|---|---|---|
| React component | `PascalCase`, no prefix | `<LineChart>` |
| Angular selector | `sp-` plus `kebab-case` | `<sp-line-chart>` |
| Vue component | `Sp` plus `PascalCase`; `sp-` plus `kebab-case` in in-DOM templates | `<SpLineChart>` |
| Props and inputs | `camelCase`, identical across all three adapters | `valueKey` |
| Accessors | `Key` suffix when they accept a string | `xKey`, `valueKey` |
| Subpath | `kebab-case` of the component | `@silverpoint/react/line-chart` |
| CSS custom property | `--sp-` plus `kebab-case` | `--sp-ink-secondary` |
| Part attribute | `part="sp-<part>"` | `part="sp-heighten"` |
| Diagnostic code | `SP` plus three digits | `SP001` |

Prop names are **identical** across React, Angular and Vue. It is a maintenance requirement:
the documentation is a single one, and the Art. 3 gate compares two trees that can only
match if the input is the same.

## 5. Props common to every chart

Present in all 33 charts, with identical names across React, Vue and Angular (REQ-094).

```ts
export interface CommonChartProps {
  /**
   * Rows to draw. If omitted, the demo dataset is rendered (REQ-093): accessor props
   * (`…Key`, `keys`, `names`) are ignored, every other prop applies (REQ-098).
   */
  data?: readonly Datum[];

  /** Style ground. Defaults to the app provider's, or `silverpoint`. */
  ground?: GroundRef;
  /** Prepared substrate within the ground (REQ-046). */
  substrate?: SubstrateName;
  /** `ink` by default; `precision` disables inking (REQ-021). */
  mode?: InkMode;
  /** Seed. If omitted, it is derived from `id` stably (REQ-003). */
  seed?: Seed;

  /** Stable identifier. If omitted, it is generated deterministically. */
  id?: string;
  /** Height of the drawing area in px. Width is the container's unless pinned. */
  height?: number;
  width?: number;

  /** `card` draws the full frame; `bare` only the drawing area (REQ-095). */
  chrome?: 'card' | 'bare';
  /**
   * How areas are filled (REQ-029).
   * `tile` shares one hatch tile per tonal level: it is the default and the one that
   * keeps weight bounded. `per-shape` traces the hatching shape by shape, with more
   * variation and much more weight; meant for a hero chart or for export.
   */
  hatchFill?: 'tile' | 'per-shape';
  title?: string;
  badge?: string;
  value?: string | number;
  unit?: string;
  footerLeft?: string;
  footerRight?: string;

  /** Accessible name. If omitted, it is derived from `title` (REQ-120). */
  label?: string;
  /** Long description for screen readers (REQ-120). */
  description?: string;
  /** Tabular alternative; `hidden` leaves it for assistive technology only (REQ-121). */
  dataTable?: 'visible' | 'hidden' | 'none';

  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;

  className?: string;
}
```

### 5.1 Default values

Part of the contract: changing them observably is a *major* change (§13).

| Prop | Default | Note |
|---|---|---|
| `ground` | `'silverpoint'` | Or the application provider's, if there is one |
| `substrate` | `'cream'` | |
| `mode` | `'ink'` | Unless the media query forces `precision` |
| `seed` | derived from `id` | Stable across renders (REQ-003) |
| `id` | generated deterministically | From the chart name and its mount position |
| `chrome` | `'card'` | |
| `hatchFill` | `'tile'` | `'per-shape'` multiplies path weight by a factor of 10 to 40 |
| `dataTable` | `'hidden'` | Present for assistive technology, visually hidden |
| `height` | `160` | Drawing area, without the frame |
| `width` | container width | Except in the server entry points, where it is mandatory |
| `locale` | the provider's, else `'en'` | Identical on server and client, so hydration matches; pass `navigator.language` to the provider to follow the browser |
| `curve` | `'monotone'` | Line and area charts |
| `orientation` | `'columns'` | `BarChart` |
| `series` | `'all'` | `LineChart` |
| `showLine` | `true` | `ComposedChart` |
| `stacked` | `false` | `StreamChart` |
| `legend` | `true` | `DonutChart` |
| `sizeRange` | `[60, 240]` | `ScatterChart`; `[100, 500]` in `BubbleChart` |

**Resolution precedence** for `ground`, `substrate`, `mode` and `locale`, highest to lowest:
chart prop → dashboard (§7.1) → application provider (§8.1, §8.2) → library default value.
The media query forcing `precision` (REQ-123) is **not a level in that chain**: it is an
override applied after resolution, so no prop, dashboard or provider can undo it. It is an
accessibility requirement, not a preference.

## 6. Token schema of a ground

```ts
export interface Ground {
  readonly name: string;
  /** How it builds tonal value. `wash` is the anticipated exception to Art. 6. */
  readonly tonalMechanism: 'hatch' | 'weight' | 'wash';
  /** Name of the registered Inker that inks it. */
  readonly inker: string;

  readonly substrates: Readonly<Record<string, string>>;
  readonly ink: Readonly<{
    primary: string;
    secondary: string;
    heighten: string;
    rule: string;
    grid: string;
    text: string;
    textMuted: string;
  }>;

  readonly inkOptions: Omit<InkOptions, 'seed' | 'nodeBudget'>;
  /** Hatch density bound, to stay within the node budget. */
  readonly maxHatchDensity: number;

  readonly typography: Readonly<{ display: string; mono: string; scale: number }>;
  /** What to draw when there is no data (REQ-007). */
  readonly emptyState: Readonly<{ text: string; rule: boolean }>;
  /** Expansion of degenerate domains (REQ-010). */
  readonly domainPadding: number;
}
```

Registering a ground is a declarative call, and it does not touch the code of any chart
(REQ-044):

```ts
import { registerGround } from '@silverpoint/grounds';
registerGround(myGround);
```

## 7. Component catalog

The 33 charts. The `REQ` column is the traceability back to the PRD. All of them accept
`CommonChartProps` in addition to their own props.

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-060 | `LineChart` | `SpLineChart` | `sp-line-chart` | `xKey`, `valueKey`, `secondaryKey?`, `curve`, `series` |
| REQ-061 | `StepChart` | `SpStepChart` | `sp-step-chart` | `xKey`, `valueKey`, `step: 'after' \| 'before' \| 'middle'` |
| REQ-062 | `SparklineRows` | `SpSparklineRows` | `sp-sparkline-rows` | `rows`, `nameKey`, `readoutKey`, `seriesKey`, `pointKey` |
| REQ-063 | `KpiCard` | `SpKpiCard` | `sp-kpi-card` | `valueKey`, `metric`, `delta`, `deltaTone` |
| REQ-064 | `BarChart` | `SpBarChart` | `sp-bar-chart` | `xKey`, `valueKey`, `secondaryKey?`, `orientation: 'columns' \| 'rows'` |
| REQ-065 | `StackedBarChart` | `SpStackedBarChart` | `sp-stacked-bar-chart` | `xKey`, `keys`, `names?` |
| REQ-066 | `ComposedChart` | `SpComposedChart` | `sp-composed-chart` | `xKey`, `barKey`, `lineKey`, `showLine` |
| REQ-067 | `WaterfallChart` | `SpWaterfallChart` | `sp-waterfall-chart` | `stepKey`, `baseKey`, `deltaKey` |
| REQ-068 | `FunnelChart` | `SpFunnelChart` | `sp-funnel-chart` | `stageKey`, `valueKey` |
| REQ-069 | `BulletChart` | `SpBulletChart` | `sp-bullet-chart` | `titleKey`, `actualKey`, `targetKey` |
| REQ-070 | `PyramidChart` | `SpPyramidChart` | `sp-pyramid-chart` | `labelKey`, `widthKey`, `toneKey?` |
| REQ-071 | `CandlestickChart` | `SpCandlestickChart` | `sp-candlestick-chart` | `timeKey`, `openKey`, `highKey`, `lowKey`, `closeKey`, `bounds?` |
| REQ-072 | `AreaChart` | `SpAreaChart` | `sp-area-chart` | `xKey`, `valueKey`, `curve` |
| REQ-073 | `RangeBandChart` | `SpRangeBandChart` | `sp-range-band-chart` | `xKey`, `lowKey`, `highKey` |
| REQ-074 | `StreamChart` | `SpStreamChart` | `sp-stream-chart` | `xKey`, `keys`, `stacked` |
| REQ-075 | `DonutChart` | `SpDonutChart` | `sp-donut-chart` | `nameKey`, `valueKey`, `centerValue?`, `centerLabel?`, `legend` |
| REQ-076 | `RadarChart` | `SpRadarChart` | `sp-radar-chart` | `subjectKey`, `valueKey`, `domain` |
| REQ-077 | `PolarBarChart` | `SpPolarBarChart` | `sp-polar-bar-chart` | `nameKey`, `valueKey` |
| REQ-078 | `RadialArcGroup` | `SpRadialArcGroup` | `sp-radial-arc-group` | `nameKey`, `valueKey` |
| REQ-079 | `RadialRings` | `SpRadialRings` | `sp-radial-rings` | `nameKey`, `valueKey` |
| REQ-080 | `GaugeArc` | `SpGaugeArc` | `sp-gauge-arc` | `percent`, `caption?`, `readout?` |
| REQ-081 | `MeterChart` | `SpMeterChart` | `sp-meter-chart` | `percent`, `caption?`, `readout?` |
| REQ-082 | `ScatterChart` | `SpScatterChart` | `sp-scatter-chart` | `xKey`, `yKey`, `sizeKey?`, `sizeRange` |
| REQ-083 | `BubbleChart` | `SpBubbleChart` | `sp-bubble-chart` | `xKey`, `yKey`, `sizeKey`, `sizeRange` |
| REQ-084 | `HeatmapChart` | `SpHeatmapChart` | `sp-heatmap-chart` | `labelKey`, `valuesKey`, `scaleMax`, `columnLabels?` |
| REQ-085 | `TreemapChart` | `SpTreemapChart` | `sp-treemap-chart` | `labelKey`, `shareKey`, `columns`, `rows` |
| REQ-086 | `SankeyChart` | `SpSankeyChart` | `sp-sankey-chart` | `sourceKey`, `targetKey`, `valueKey` |
| REQ-087 | `ActivityGrid` | `SpActivityGrid` | `sp-activity-grid` | `dateKey`, `countKey`, `levelKey`, `weeks` |
| REQ-088 | `CoxcombChart` | `SpCoxcombChart` | `sp-coxcomb-chart` | `nameKey`, `valueKey`, `startAngle` |
| REQ-089 | `WindRose` | `SpWindRose` | `sp-wind-rose` | `bearingKey`, `valueKey`, `sectors`, `bins` |
| REQ-090 | `VolvelleChart` | `SpVolvelleChart` | `sp-volvelle-chart` | `rings`, `indexRing`, `indexValue` (they apply to the demo's rings too, REQ-098) |
| REQ-091 | `ChordRing` | `SpChordRing` | `sp-chord-ring` | `sourceKey`, `targetKey`, `valueKey`, `maxCategories` |
| REQ-092 | `OrbitChart` | `SpOrbitChart` | `sp-orbit-chart` | `orbits`, `periodKey`, `markerKey` |

Own props that the table leaves implicit:

- **`HeatmapChart.columnLabels?: readonly string[]`** names the columns in order; they head the
  table columns, the keyboard announcement and the readout, and are drawn above the cells.
  Missing names fall back to `#k`; names beyond the drawn columns are ignored with `SP002`.
- **`OrbitChart`**: `data` holds the orbit rows (Data Model §2.10); `orbits` caps the orbits
  shown, from the inside out; `markerKey` reads a row's markers (default `'markers'`) and
  `periodKey` a marker's period (default `'period'`, 0-1 over the cycle).
- **`VolvelleChart`**: `data` holds the rings from the inside out (Data Model §2.12); `rings`
  caps them; `indexRing` (0-based, default 0) and `indexValue` (default: that ring's first
  segment) choose the index angle. Without `data` they address the demo's rings `Day`, `Shift`,
  `Team` (REQ-098).

### 7.1 Composition: Dashboard

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-200 | `Dashboard` | `SpDashboard` | `sp-dashboard` | `DashboardProps` |
| REQ-200 | `DashboardCell` | `SpDashboardCell` | `sp-dashboard-cell` | `cell?` |

A declarative grid of cards (PRD §6.10). Charts are children; the layout is a data-only object
matched to children by cell id (DD-013). It is not a builder: there are no placement
coordinates, no `order`, no drag or resize.

**Types** (public):

```ts
/** The three container breakpoints; their widths are fixed (TD DD-014). */
export type DashboardBreakpoint = 'sm' | 'md' | 'lg';

/** A value that may differ per breakpoint; a bare number applies to all three. */
export type PerBreakpoint<T> = T | Partial<Record<DashboardBreakpoint, T>>;

/** Serialisable layout (REQ-201). No functions, no DOM, no chart references. */
export interface DashboardLayout {
  /** Columns per breakpoint. Default `{ sm: 1, md: 2, lg: 4 }` (REQ-208). */
  columns?: PerBreakpoint<number>;
  /** Height of one row unit, in px, card chrome included. Default `240`. */
  rowHeight?: number;
  /** Gap between cells, in px. Default `16`. */
  gap?: number;
  /** Cells in reading order (REQ-203). Omitted: every child, span 1. */
  cells?: readonly DashboardCellLayout[];
}

export interface DashboardCellLayout {
  /** Matches `DashboardCell`'s `cell` prop; unique within the dashboard (REQ-205). */
  id: string;
  /** Default `1`. Clamped to the breakpoint's columns with `SP014` (REQ-204). */
  colSpan?: PerBreakpoint<number>;
  /** Default `1`. */
  rowSpan?: PerBreakpoint<number>;
}

/** Link on a category key across the dashboard's charts (REQ-216). */
export interface DashboardLink {
  /** The datum field whose value is matched, e.g. `'hour'`. */
  key: string;
}

/** Name is required by the type: `title` or `label` (REQ-214). */
type DashboardName = { title: string; label?: string } | { title?: undefined; label: string };

export type DashboardProps = DashboardName & {
  /** Stable identifier; seeds of unnamed charts derive from it (REQ-209). Required. */
  id: string;
  layout?: DashboardLayout;
  /** Long description, exposed as the region's description (REQ-214). */
  description?: string;
  /** Heading level of `title`. Default `2`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Width in px used for nominal cell boxes on the server and at hydration (REQ-207). Default `1200`. */
  ssrWidth?: number;
  /** Linked interaction (REQ-216); client entry points only. */
  link?: DashboardLink;

  /** Inherited by every chart inside, below the chart's own prop (REQ-212). */
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  locale?: string;

  className?: string;
};

export interface DashboardCellProps {
  /** The layout cell this child fills. Omitted: next in source order, span 1. */
  cell?: string;
}
```

**`id` is required.** Charts may omit theirs because a single chart's derived id is harmless; in a
dashboard, every unnamed chart's seed hangs off this id (REQ-209), so it must be stable and chosen
by the consumer.

**`id` is required.** Every unnamed chart's seed hangs off it (REQ-209), so it must be stable
and chosen by the consumer. **`title` or `label` is required** by the type (REQ-214).

**Resolved model** (internal surface, §2):

```ts
export interface DashboardModel {
  readonly id: string;
  /** In reading order. */
  readonly cells: readonly ResolvedCell[];
  /** The CSS custom properties of the wrapper, e.g. `--sp-dashboard-columns-md: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

export interface ResolvedCell {
  /** The layout cell's id; for a child placed in source order, its source index. */
  readonly id: string;
  /** The child this cell holds, as its index in `childCells`, so the adapter emits it here (I-11). */
  readonly child: number;
  /** Derived chart id: `${dashboard.id}--${cell.id}` (REQ-209). */
  readonly chartId: string;
  readonly span: Readonly<Record<DashboardBreakpoint, { col: number; row: number }>>;
  /** Outer box at `ssrWidth`, 2 decimals (REQ-002, REQ-206). */
  readonly nominal: { readonly width: number; readonly height: number };
  /** The cell's CSS custom properties, e.g. `--sp-cell-col-lg: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

/** Pure; emits SP014 / SP015 through the diagnostics channel. */
export function resolveDashboard(props: DashboardProps, childCells: readonly (string | undefined)[]): DashboardModel;

/** The chart's width and drawing-area height inside a cell box, card chrome subtracted (REQ-206). */
/** `recipe`, when given, is built at a probe height to measure chrome the recipe adds itself (KpiCard's value line). */
export function cellChartBox<P extends CommonChartProps>(cell: { width: number; height: number }, chartProps: P, recipe?: ChartRecipe<P>): { width: number; height: number };

/** Items of `model` whose datum carries `value` under `key` (REQ-216, REQ-217). */
export function linkedItems(model: ChartModel, key: string, value: unknown): readonly number[];
```

`childCells` is the `cell` prop of each child in source order — the only thing an adapter reads
from its children, and something every framework can read synchronously during render.

**Default values** (part of the contract, like §5.1):

| Prop | Default | Note |
|---|---|---|
| `layout.columns` | `{ sm: 1, md: 2, lg: 4 }` | Collapses 4 → 2 → 1 (REQ-208) |
| `layout.rowHeight` | `240` | 160 drawing area + the default card chrome, rounded up |
| `layout.gap` | `16` | |
| `colSpan`, `rowSpan` | `1` | |
| `headingLevel` | `2` | |
| `ssrWidth` | `1200` | Nominal boxes use the breakpoint `ssrWidth` falls in: `lg` at ≥ 1024, `md` at 640–1023, `sm` below (DD-015) |

**Size precedence** of a chart inside a cell: its own `width`/`height` → the cell box from
`cellChartBox` → the chart defaults.

**By adapter.** React:

```tsx
import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';
import { KpiCard } from '@silverpoint/react/kpi-card';
import { LineChart } from '@silverpoint/react/line-chart';
import { BarChart } from '@silverpoint/react/bar-chart';

const layout = {
  columns: { sm: 1, md: 2, lg: 4 },
  cells: [
    { id: 'revenue' }, { id: 'users' }, { id: 'churn' }, { id: 'nps' },
    { id: 'traffic', colSpan: { md: 2, lg: 3 }, rowSpan: 2 },
    { id: 'errors' },
  ],
} satisfies DashboardLayout;

<Dashboard id="ops" title="Operations" layout={layout} link={{ key: 'hour' }}>
  <DashboardCell cell="revenue"><KpiCard title="Revenue" … /></DashboardCell>
  …
  <DashboardCell cell="traffic"><LineChart data={rows} xKey="hour" valueKey="hits" title="Traffic" /></DashboardCell>
  <DashboardCell cell="errors"><BarChart data={errs} xKey="hour" valueKey="count" title="Errors" /></DashboardCell>
</Dashboard>
```

`Dashboard` from `/server/dashboard` renders with no client JavaScript and rejects `link` by
type. The client `Dashboard` renders a `"use client"` link boundary only when `link` is given
(REQ-104 holds: no link, no client boundary).

Vue:

```vue
<SpDashboard id="ops" title="Operations" :layout="layout" :link="{ key: 'hour' }">
  <SpDashboardCell cell="traffic"><SpLineChart … /></SpDashboardCell>
</SpDashboard>
```

Angular — signal inputs, `OnPush`, standalone (REQ-101); cell ids are read from
`contentChildren`, available during server rendering:

```html
<sp-dashboard id="ops" title="Operations" [layout]="layout" [link]="{ key: 'hour' }">
  <sp-dashboard-cell cell="traffic"><sp-line-chart … /></sp-dashboard-cell>
</sp-dashboard>
```

## 8. API by adapter

### 8.1 React

```tsx
import { LineChart, SilverpointProvider } from '@silverpoint/react';

<SilverpointProvider ground="silverpoint" substrate="cream" mode="ink">
  <LineChart
    data={rows}
    xKey="hour"
    valueKey="hits"
    title="Throughput per hour"
    unit="requests"
    onActiveChange={setActive}
  />
</SilverpointProvider>
```

**Server and client boundaries** (REQ-103, REQ-104). There are two entry points per chart:

| Import | Marker | Interaction | Use |
|---|---|---|---|
| `@silverpoint/react/line-chart` | `"use client"` | Yes | Default |
| `@silverpoint/react/server/line-chart` | No marker | No | RSC; requires explicit `width` and `height` |

The server variant emits pure SVG with no client JavaScript. It accepts neither
`onActiveChange` nor `dataTable: 'visible'` with keyboard navigation; the type prevents it.

**Imperative API** through `ref`, deliberately minimal:

```ts
export interface ChartHandle {
  getGeometry(): Geometry;
  toSVGString(): string;
}
```

### 8.2 Angular

Standalone components with signal inputs and `OnPush` (REQ-101).

```ts
import { SpLineChart } from '@silverpoint/angular/line-chart';
```

In Vue the subpath mirrors React's:

```ts
import { SpLineChart } from '@silverpoint/vue/line-chart';
import { provideSilverpoint } from '@silverpoint/angular';

bootstrapApplication(App, {
  providers: [provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' })],
});
```

```html
<sp-line-chart
  [data]="rows()"
  xKey="hour"
  valueKey="hits"
  title="Throughput per hour"
  unit="requests"
  (activeChange)="active.set($event)" />
```

Inputs are declared with `input()` and are read-only inside the component. The component
SHALL NOT expose public methods beyond `getGeometry()` and `toSVGString()`, so as to keep
symmetry with `ChartHandle`.

### 8.3 Vue

Components authored with `<script setup>`, typed props and typed emits (REQ-108).

```ts
import { SpLineChart, provideSilverpoint } from '@silverpoint/vue';

// main.ts
app.use(provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' }));
```

```vue
<template>
  <SpLineChart
    :data="rows"
    x-key="hour"
    value-key="hits"
    title="Throughput per hour"
    unit="requests"
    @active-change="active = $event" />
</template>
```

Props are the same `CommonChartProps` as every other adapter; in templates they may be
written in `kebab-case`, which Vue maps to the `camelCase` declaration. Emits are typed,
so `@active-change` carries `ActiveItem | null` and nothing else.

**Server rendering.** The adapter renders under `@vue/server-renderer` with no DOM access,
which is what the string gate of DD-003 consumes and what REQ-109 verifies after
hydration. There is no Nuxt-specific code: a Nuxt app consumes the package like any other
Vue app, and Nuxt is not a validated integration in v1.

**Imperative API** by template ref, identical to `ChartHandle`:

```ts
const chart = ref<InstanceType<typeof SpLineChart>>();
chart.value?.getGeometry();
```

### 8.4 Ribbon generator

`ChordRing` (REQ-091) needs a generator of ribbons between angular positions that the arc
engine does not cover. The core exposes it as an internal part and the Technical Design
decides whether it leans on `d3-chord` or is implemented by hand; either way, the decision
does not alter any signature in this specification.

## 9. Events and interaction

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onActiveChange` | `@active-change` | `activeChange` | `ActiveItem \| null` | The pointer enters or leaves an item, or keyboard focus moves (REQ-141) |
| `onSelect` | `@select` | `select` | `ActiveItem` | Click, `Enter` or `Space` on an item |
| `onLinkChange` | `@link-change` | `linkChange` | `{ key: string; value: unknown } \| null` | On a `Dashboard` with `link`: the linked value changes (REQ-216); `null` when the source clears (REQ-218) |

Charts inside a linked dashboard keep their own `onActiveChange`; a linked mark is **not** an
active item and fires no `onActiveChange` in the other charts.

`onActiveChange` emits `null` when leaving the area or losing focus, leaving no residual
state (REQ-143). The active item is resolved by the core as a pure function of position
and geometry, without consulting the DOM (REQ-140).

On touch input, resolution is by proximity, with a minimum target of 24 px (REQ-144).

**Custom readout.** `tooltip` accepts a consumer-supplied renderer (REQ-142); if it is
omitted, the included one is used.

```tsx
<LineChart tooltip={(active) => <MyReadout item={active} />} />
```

```html
<sp-line-chart><ng-template spTooltip let-active>…</ng-template></sp-line-chart>
```

```vue
<SpLineChart><template #tooltip="{ active }">…</template></SpLineChart>
```

## 10. DOM and CSS contract

### 10.1 `part` attributes

Every emitted stroke carries `part`, and it is the only stable coupling point between the
SVG and the stylesheet. Overriding a variable re-themes without re-rendering (REQ-042).

| `part` | CSS property applied | Variable |
|---|---|---|
| `sp-ink` | `stroke`, `fill` | `--sp-ink` |
| `sp-ink-secondary` | `stroke`, `fill` | `--sp-ink-secondary` |
| `sp-heighten` | `fill` | `--sp-heighten` |
| `sp-rule` | `stroke` | `--sp-rule` |
| `sp-grid` | `stroke` | `--sp-grid` |
| `sp-axis` | `fill` | `--sp-text-muted` |

The dashboard composition (§7.1) adds, on HTML elements: `dashboard` (the `section`),
`dashboard-title` (the heading), `dashboard-description`, `dashboard-cell` (each `article`), and
`linked` on a chart item under a linked mark (client only, REQ-219).

### 10.2 Public CSS custom properties

```css
.sp-ground-silverpoint[data-substrate='cream'] {
  --sp-substrate:      #EDE7DA;
  --sp-ink:            #5A5E65;
  --sp-ink-secondary:  #685C4D;
  --sp-heighten:       #FFFFFF;
  --sp-rule:           #737A82;
  --sp-grid:           #737A82;
  --sp-text:           #3F4348;
  --sp-text-muted:     #5A5E65;  /* = --sp-ink in this ground, see Data Model §3.2 */
  --sp-font-display:   'EB Garamond', 'Iowan Old Style', Georgia, serif;
  --sp-stroke-width:   0.9;
  --sp-hatch-gap:      7;
  --sp-radius:         2px;
}
```

The exact values of the four substrates are fixed by the Data Model. Any variable not
listed here is internal and may change in a minor version.

The dashboard composition adds `--sp-dashboard-gap` (default `16px`, overrides `layout.gap`), and
the variables the adapter writes from the resolved model: `--sp-dashboard-columns-sm/md/lg`,
`--sp-dashboard-row-height` and `--sp-dashboard-layout-gap` (the value `--sp-dashboard-gap` falls back
to, so the public property still overrides it from CSS) on the wrapper, `--sp-cell-col-sm/md/lg` and `--sp-cell-row-sm/md/lg` on each cell. Container
breakpoints are fixed in the stylesheet: `sm` < 640 px ≤ `md` < 1024 px ≤ `lg` (DD-014).

**There is no monospace variable.** The system uses a single family: monospace is an
invention of the typewriter and has no place in a Renaissance ground. What motivated its
use —aligning figures— is solved by EB Garamond's `tnum` feature, verified present. Small
caps lines are set with `text-transform: uppercase` and open tracking, which is
deterministic in any engine; the Google Fonts build of EB Garamond does not include `smcp`.

### 10.3 Accessibility contract

| Element | Contract |
|---|---|
| SVG root | `role="img"`, `aria-labelledby` pointing at the name and, if present, the description (REQ-120) |
| Tabular alternative | Associated `<table>`, visible or visually hidden according to `dataTable` (REQ-121) |
| Data points | Traversable with `Tab` and arrow keys; each announces series, category and value (REQ-122) |
| Forced mode | `prefers-contrast: more` or `forced-colors: active` force `precision` (REQ-123) |
| Motion | `prefers-reduced-motion: reduce` omits the entrance animation (REQ-125) |
| Dashboard wrapper | `<section part="dashboard" aria-labelledby="{id}-title">`, `aria-describedby` when `description` is given; `aria-label` when only `label` is (REQ-214) |
| Dashboard heading | `<h{headingLevel} id="{id}-title">` |
| Dashboard cell | `<article part="dashboard-cell">` labelled by its chart's accessible name (REQ-214) |
| Dashboard order | DOM order = reading order at every breakpoint (REQ-203); the dashboard adds no tab stop (REQ-215) |
| Linked marks | `aria-hidden`; no live-region update (REQ-218) |

`dataTable: 'none'` is only legitimate when the consumer supplies their own accessible
alternative; the documentation says so and development mode warns about it.

## 11. Catalog of errors and warnings

Stable codes, part of the public surface. Those with `warn` severity are stripped from the
production bundle; those with `error` severity are always thrown.

| Code | Severity | Requirement | Condition |
|---|---|---|---|
| `SP001` | warn | REQ-007 | Empty dataset; the ground's empty state is drawn |
| `SP002` | warn | REQ-008 | A value cannot be drawn as given — `null`, not finite, or outside the chart's data contract — so it is corrected or omitted. The generic message names no remedy; each chart states what happened and its own remedy in the diagnostic's specifics |
| `SP003` | warn | REQ-009 | Zero-dimension container; the render is deferred |
| `SP004` | warn | REQ-010 | Degenerate scale domain; it is expanded with `domainPadding` |
| `SP005` | error (dev) / warn (prod) | REQ-025 | More than one item marked with heightening; the first one is applied |
| `SP006` | warn | REQ-026 | Inker not registered; falls back to `NullInker` |
| `SP007` | warn | REQ-045 | Ground not registered; falls back to `silverpoint` |
| `SP008` | warn | REQ-096 | Data volume above the family's threshold |
| `SP009` | error | REQ-097 | A non-derivable scale bound is missing; the message names the property |
| `SP010` | warn | REQ-091 | `ChordRing` above 12 categories |
| `SP011` | warn | NFR §7 | Path byte budget exceeded; `hatchFill: 'tile'` or a larger gap is suggested |
| `SP012` | error (CI) | REQ-127 | A ground does not reach the minimum contrast |
| `SP014` | warn | REQ-204 | A dashboard cell spans more columns than a breakpoint has; clamped |
| `SP015` | warn | REQ-205 | A dashboard's layout and children disagree (unknown cell, unplaced child, duplicate id); unmatched children rendered in source order, span 1 |
| `SP016` | warn | REQ-217 | A chart in a linked dashboard has no field named by `link.key` |
| `SP013` | warn | REQ-032 | The `@silverpoint/fonts` face failed to load; rendering fell back to the system stack and golden images will no longer match |

Every diagnostic includes the chart name, the property involved and the `REQ-NNN` that
motivates it.

## 12. Limits and budgets

| Limit | v1 value | Behaviour on exceeding it |
|---|---|---|
| Points per series, cartesian families | 500 | `SP008` |
| Sectors, polar families | 60 | `SP008` |
| Categories, `ChordRing` | 12 | `SP010` |
| Path data per chart | 40 KB | `SP011` |
| Weight of `@silverpoint/core` + `react` with one chart | 45 KB min+gzip | CI fails (REQ-164) |
| Geometry computation, 100 points | 2 ms | The CI benchmark fails |
| `dashboard` subpath, per adapter, over its one-chart budget | 2 KB min+gzip | CI fails (REQ-220) |
| Cells per dashboard | 24 (advisory) | No diagnostic; documented guidance, rendered anyway |
| Dashboard layout resolution, 24 cells | 0.5 ms | The CI benchmark fails |
| Reference 12-card dashboard, server HTML | 480 KB | `tools/path-weight` fails the PR |

## 13. Versioning and deprecation

SemVer over the public surface of §2.

- **Major**: removing or renaming a prop, a component, an `SPNNN` code, a `--sp-` variable
  or a `part`; changing a default value observably.
- **Minor**: adding charts, optional props, grounds, new codes.
- **Patch**: fixes that do not alter the normalised SVG output. A change that does alter
  it **is not a patch**, even if it is a visual improvement: it breaks the golden images of
  consumers using the same gate.

Deprecation: a prop marked `@deprecated` warns for at least two minor versions before
being removed in the next major. The four packages are always published with the same
version.

---

## Change History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-13 | Initial version |
| 1.2 | 2026-09-13 | Palette replaced with the one verified against the contrast thresholds (Data Model §3.2) |
| 1.1 | 2026-09-13 | `@silverpoint/fonts` and the `hatchFill` prop are introduced; rounding to 2 decimals; `--sp-font-mono` is removed; `SP011` switches to measuring bytes |
| 1.5 | 2026-09-13 | Vue adapter added: package, naming, a Vue column across the 33-row catalog, §8.3, and Vue emits in §9 |
| 1.4 | 2026-09-13 | §1.1 added: bundler consumption guarantees for Vite and Next.js (REQ-033, REQ-034) |
| 1.3 | 2026-09-13 | Converted to English; diagnostic SP013 added for typeface load failure (Analyze finding A-05) |
| 1.6 | 2026-09-25 | Deltas folded: `locale` default identical on server and client (003); `HeatmapChart.columnLabels` (006); `SP002` covers every value a chart cannot draw as given (007); how `OrbitChart` and `VolvelleChart` props read their data (009, 010); view props apply to the demo (011). §7.1 Dashboard composition with `onLinkChange`, parts, CSS variables, accessibility contract, `SP014`–`SP016` and budgets (feature-001). The media query forcing `precision` is stated as an override after resolution (Analyze A-06) |

## Constitution check

- **Art. 2** — §1 and §8 maintain the boundary: the adapters only consume `Geometry`, and
  the ribbon generator (§8.4) lives in the core.
- **Art. 4** — `seed` is a public prop in §5 and is derived from `id` when omitted.
- **Art. 5** — §10.3 fixes the accessibility contract, and §5 establishes that the media
  query forcing `precision` cannot be overridden by prop.
- **Art. 6** — §6 requires every ground to declare its `tonalMechanism`.
- **Art. 7** — §6 defines the ground as a declarative object and `registerGround` as the
  only way to register one.
- **Art. 8** — §3.1 and §10 implement the consequence of not depending on Tailwind: the
  `Inker` emits shape without paint, and color enters through CSS by way of `part`.
- **Art. 3** (v1.5) — §7.1 requires a dashboard `id` and derives chart ids from it, so the
  wrapper and every chart inside are comparable across adapters.
- **Requested exception:** none.
