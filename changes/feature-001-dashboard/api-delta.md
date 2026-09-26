# API Spec delta — Dashboard composition

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo el cambio que mencionas, las 4 puertas del dashboard y el delta-011") — gate 2; **folded into `specs/api-spec.md` (v1.6) on 2026-09-25** |
| **Amends** | [API Spec](../../specs/api-spec.md) v1.5 → v1.6: §1, §2, §3, §5.1, new §7.1, §8.1–8.3, §9, §10.1–10.3, §11, §12 |
| **SemVer** | `minor` — new components, new optional props, new codes (§13) |

## 1. Packages and entry points (§1)

No new package: the dashboard ships inside the existing six, under one version (the release group
stays as it is and needs no new trusted publisher).

| Package | Subpath | Exports |
|---|---|---|
| `@silverpoint/core` | `@silverpoint/core` (internal surface, §2) | `resolveDashboard`, `cellChartBox`, `linkedItems`, types below |
| `@silverpoint/react` | `@silverpoint/react/dashboard` (`"use client"` only on `DashboardLink`) | `Dashboard`, `DashboardCell` |
| `@silverpoint/react` | `@silverpoint/react/server/dashboard` | `Dashboard`, `DashboardCell` (no link) |
| `@silverpoint/vue` | `@silverpoint/vue/dashboard` | `SpDashboard`, `SpDashboardCell` |
| `@silverpoint/angular` | `@silverpoint/angular/dashboard` | `SpDashboard` (`sp-dashboard`), `SpDashboardCell` (`sp-dashboard-cell`) |
| `@silverpoint/grounds` | stylesheet | the `.sp-dashboard` rules and container queries (§10.2) |

## 2. Types (§3)

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

### Resolved model (internal surface, §2)

```ts
export interface DashboardModel {
  readonly id: string;
  /** In reading order. */
  readonly cells: readonly ResolvedCell[];
  /** The CSS custom properties of the wrapper, e.g. `--sp-dashboard-columns-md: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

export interface ResolvedCell {
  readonly id: string;
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
export function cellChartBox(cell: { width: number; height: number }, chartProps: CommonChartProps): { width: number; height: number };

/** Items of `model` whose datum carries `value` under `key` (REQ-216, REQ-217). */
export function linkedItems(model: ChartModel, key: string, value: unknown): readonly number[];
```

`childCells` is the `cell` prop of each child in source order — the only thing an adapter reads
from its children, and something every framework can read synchronously during render.

## 3. Default values (§5.1) — additions

| Prop | Default | Note |
|---|---|---|
| `layout.columns` | `{ sm: 1, md: 2, lg: 4 }` | Observable's collapse, 4 → 2 → 1 |
| `layout.rowHeight` | `240` | 160 drawing area + the default card chrome, rounded up |
| `layout.gap` | `16` | |
| `colSpan`, `rowSpan` | `1` | |
| `headingLevel` | `2` | |
| `ssrWidth` | `1200` | The `lg` design width. Nominal boxes use the breakpoint `ssrWidth` falls in: `lg` at ≥ 1024, `md` at 640–1023, `sm` below (DD-015, A-03) |

**Resolution precedence** for `ground`, `substrate`, `mode`, `locale` becomes: chart prop →
**dashboard** → application provider → library default. The media query forcing `precision`
(REQ-123) is **not a level in that chain**: it is an override applied after resolution, so no prop,
dashboard or provider can undo it (REQ-212, A-06). The same wording replaces the ambiguous sentence
of API Spec §5.1 when this delta is folded.

**Size precedence** of a chart inside a cell: its own `width`/`height` → the cell box from
`cellChartBox` → the chart defaults.

## 4. §7.1 Composition catalog (new)

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-200 | `Dashboard` | `SpDashboard` | `sp-dashboard` | `DashboardProps` |
| REQ-200 | `DashboardCell` | `SpDashboardCell` | `sp-dashboard-cell` | `cell?` |

## 5. By adapter (§8)

### React

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

`Dashboard` from `/server/dashboard` renders with no client JavaScript; it rejects `link` by type.
The client `Dashboard` is a server component that renders a `"use client"` `DashboardLink` only
when `link` is given (REQ-104 holds: no link, no client boundary).

### Vue

```vue
<SpDashboard id="ops" title="Operations" :layout="layout" :link="{ key: 'hour' }">
  <SpDashboardCell cell="traffic"><SpLineChart … /></SpDashboardCell>
</SpDashboard>
```

### Angular

```html
<sp-dashboard id="ops" title="Operations" [layout]="layout" [link]="{ key: 'hour' }">
  <sp-dashboard-cell cell="traffic"><sp-line-chart … /></sp-dashboard-cell>
</sp-dashboard>
```

Signal inputs, `OnPush`, standalone (REQ-101). The cell ids are read from `contentChildren`, which
is available during server rendering.

## 6. Events (§9) — additions

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onLinkChange` | `@link-change` | `linkChange` | `{ key: string; value: unknown } \| null` | The linked value changes (REQ-216); `null` when the source clears (REQ-218) |

Charts inside a linked dashboard keep their own `onActiveChange`; the linked mark is **not** an
active item and fires no `onActiveChange` in the other charts.

## 7. DOM and CSS contract (§10)

### `part` attributes

| `part` | Element |
|---|---|
| `dashboard` | the `section` wrapper |
| `dashboard-title` | the heading |
| `dashboard-description` | the description paragraph |
| `dashboard-cell` | each `article` |
| `linked` | a chart item under a linked mark (client only, REQ-219) |

### Public CSS custom properties

| Property | Default | Use |
|---|---|---|
| `--sp-dashboard-gap` | `16px` | Overrides `layout.gap` from CSS |
| `--sp-dashboard-columns-sm/md/lg` | from the model | Written by the adapter from `DashboardModel.style` |
| `--sp-cell-col-sm/md/lg`, `--sp-cell-row-sm/md/lg` | from the model | Written per cell |

Container breakpoints, fixed in the stylesheet: `sm` < 640 px ≤ `md` < 1024 px ≤ `lg`.

### Accessibility contract

| Element | Contract |
|---|---|
| Wrapper | `<section part="dashboard" aria-labelledby="{id}-title" [aria-describedby="{id}-desc"]>`; if only `label` is given, `aria-label` (REQ-214) |
| Heading | `<h{headingLevel} id="{id}-title">` |
| Cell | `<article part="dashboard-cell" aria-labelledby="{chart name id}">` (REQ-214) |
| Order | DOM order = reading order at every breakpoint (REQ-203) |
| Linked marks | `aria-hidden`; no live-region update (REQ-218) |

## 8. Diagnostics (§11) — additions

| Code | Severity | Requirement | Condition |
|---|---|---|---|
| `SP014` | warn | REQ-204 | A cell spans more columns than a breakpoint has; clamped |
| `SP015` | warn | REQ-205 | Layout and children disagree (unknown cell, unplaced child, duplicate id); unmatched children rendered in source order, span 1 |
| `SP016` | warn | REQ-217 | A chart in a linked dashboard has no field named by `link.key` |

## 9. Limits and budgets (§12) — additions

| Limit | Value | On exceeding it |
|---|---|---|
| `dashboard` subpath, per adapter, over its one-chart budget | 2 KB min+gzip | CI fails (REQ-220) |
| Cells per dashboard | 24 (advisory) | No diagnostic: documented guidance only, rendered anyway (A-04) |
| Layout resolution, 24 cells | 0.5 ms | The CI benchmark fails |
| Reference 12-card dashboard, server HTML | 480 KB | `tools/path-weight` fails the PR |

## Constitution check

- **Art. 2** — every number an adapter writes comes from `DashboardModel` or `cellChartBox`.
- **Art. 3 / Art. 4** — `id` required, chart ids derived (REQ-209); linked state client-only.
- **Art. 5** — the accessibility contract above; name enforced by the type.
- **Art. 8** — no CSS framework; subpath budget.
- **Exception requested:** none.
