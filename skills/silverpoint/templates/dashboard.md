# Dashboard

A dashboard is a responsive grid of cards. The charts are its children, and the layout is a plain,
serialisable object matched to them by cell id. There are no placement coordinates and no drag or
resize.

- **`id` is required.** The seed of every chart without an id of its own derives from it
  (`<dashboard id>--<cell id>`), so choose a stable one.
- **`title` or `label` is required.** It is the region's name. React and Vue refuse a dashboard
  without one by type, and Angular warns `SP002`.
- **The cells are in reading order.** `columns` defaults to `{ sm: 1, md: 2, lg: 4 }` and collapses
  4 → 2 → 1 by container width. A `colSpan` wider than the breakpoint's columns is clamped, with
  `SP014`.
- **A chart inside a cell takes the cell's box** unless it sets its own `width` and `height`, and it
  inherits the dashboard's `ground`, `substrate`, `mode`, `locale` and `palette`.
- **`link={{ key: 'hour' }}` highlights the same value** of that field in every chart when one is
  hovered or focused. It is client-only: React's server `Dashboard` refuses it.
- **On the server,** cells are sized at `ssrWidth` (1200 by default) until they are measured.

<!-- generated:dashboard-props -->

## Layout

<!-- generated:dashboard-layout -->

## React

```tsx
import { Dashboard, DashboardCell, type DashboardLayout } from '@silverpoint/react/dashboard';
import { BarChart } from '@silverpoint/react/bar-chart';
import { KpiCard } from '@silverpoint/react/kpi-card';
import { LineChart } from '@silverpoint/react/line-chart';

const layout: DashboardLayout = {
  columns: { sm: 1, md: 2, lg: 4 },
  cells: [{ id: 'revenue' }, { id: 'traffic', colSpan: { md: 2, lg: 3 }, rowSpan: 2 }, { id: 'errors' }],
};

// A type, not an interface: an interface has no index signature, so it is not a `Datum`.
type Row = { readonly hour: string; readonly hits: number; readonly errors: number };

export function Operations({ rows, revenue }: { rows: readonly Row[]; revenue: number }) {
  return (
    <Dashboard id="ops" title="Operations" layout={layout} link={{ key: 'hour' }}>
      <DashboardCell cell="revenue">
        <KpiCard title="Revenue" data={[{ value: revenue }]} unit="EUR" />
      </DashboardCell>
      <DashboardCell cell="traffic">
        <LineChart title="Traffic" data={rows} xKey="hour" valueKey="hits" />
      </DashboardCell>
      <DashboardCell cell="errors">
        <BarChart title="Errors" data={rows} xKey="hour" valueKey="errors" />
      </DashboardCell>
    </Dashboard>
  );
}
```

React hands each cell's box and configuration to its chart as props, so a chart must be the cell's
direct child.

## Vue

```vue
<script setup lang="ts">
import { SpDashboard, SpDashboardCell, type DashboardLayout } from '@silverpoint/vue/dashboard';
import { SpBarChart } from '@silverpoint/vue/bar-chart';
import { SpLineChart } from '@silverpoint/vue/line-chart';

defineProps<{ rows: readonly { hour: string; hits: number; errors: number }[] }>();

const layout: DashboardLayout = { cells: [{ id: 'traffic', colSpan: { md: 2, lg: 3 } }, { id: 'errors' }] };
</script>

<template>
  <SpDashboard id="ops" title="Operations" :layout="layout" :link="{ key: 'hour' }">
    <SpDashboardCell cell="traffic"><SpLineChart title="Traffic" :data="rows" x-key="hour" value-key="hits" /></SpDashboardCell>
    <SpDashboardCell cell="errors"><SpBarChart title="Errors" :data="rows" x-key="hour" value-key="errors" /></SpDashboardCell>
  </SpDashboard>
</template>
```

## Angular

```ts angular
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpBarChart } from '@silverpoint/angular/bar-chart';
import { SpDashboard, SpDashboardCell, type DashboardLayout } from '@silverpoint/angular/dashboard';
import { SpLineChart } from '@silverpoint/angular/line-chart';

@Component({
  selector: 'app-operations',
  imports: [SpDashboard, SpDashboardCell, SpLineChart, SpBarChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-dashboard [id]="'ops'" [title]="'Operations'" [layout]="layout" [link]="{ key: 'hour' }">
      <sp-dashboard-cell [cell]="'traffic'">
        <sp-line-chart [title]="'Traffic'" [data]="rows()" [xKey]="'hour'" [valueKey]="'hits'" />
      </sp-dashboard-cell>
      <sp-dashboard-cell [cell]="'errors'">
        <sp-bar-chart [title]="'Errors'" [data]="rows()" [xKey]="'hour'" [valueKey]="'errors'" />
      </sp-dashboard-cell>
    </sp-dashboard>
  `,
})
export class Operations {
  readonly rows = input.required<readonly { hour: string; hits: number; errors: number }[]>();
  protected readonly layout: DashboardLayout = { cells: [{ id: 'traffic', colSpan: { md: 2, lg: 3 } }, { id: 'errors' }] };
}
```
