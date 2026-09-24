/**
 * The chart catalog as the gates and the adapter tests see it: one row per chart, naming its
 * recipe, the subpath every adapter publishes it at, and a consumer sample that reaches the data
 * through non-default accessor keys. Adding a chart to a phase is adding a row here.
 */
import {
  activityGrid,
  bulletChart,
  heatmapChart,
  lineChart,
  pyramidChart,
  sankeyChart,
  treemapChart,
  type ChartRecipe,
  type CommonChartProps,
} from '@silverpoint/core';

export interface CatalogEntry {
  /** Recipe name, React component name, and the suffix of the Vue `Sp*` name. */
  readonly chart: string;
  readonly req: string;
  /** Subpath of every adapter (`@silverpoint/react/<slug>`) and the Angular selector's suffix. */
  readonly slug: string;
  readonly recipe: ChartRecipe<CommonChartProps>;
  /** Name of the props interface in `packages/core/src/types/props.ts`. */
  readonly propsInterface: string;
  /** Consumer props: own data, read through keys other than the defaults. */
  readonly sample: Readonly<Record<string, unknown>>;
}

const entry = (row: Omit<CatalogEntry, 'recipe'> & { readonly recipe: ChartRecipe<never> }): CatalogEntry =>
  row as unknown as CatalogEntry;

export const CATALOG: readonly CatalogEntry[] = [
  entry({
    chart: 'LineChart',
    req: 'REQ-060',
    slug: 'line-chart',
    recipe: lineChart,
    propsInterface: 'LineChartProps',
    sample: { data: [{ day: 'Mon', hits: 3 }, { day: 'Tue', hits: 5 }, { day: 'Wed', hits: 4 }], xKey: 'day', valueKey: 'hits' },
  }),
  entry({
    chart: 'BulletChart',
    req: 'REQ-069',
    slug: 'bullet-chart',
    recipe: bulletChart,
    propsInterface: 'BulletChartProps',
    sample: { data: [{ goal: 'Revenue', done: 72, aim: 80 }, { goal: 'Profit', done: 45, aim: 60 }], titleKey: 'goal', actualKey: 'done', targetKey: 'aim' },
  }),
  entry({
    chart: 'PyramidChart',
    req: 'REQ-070',
    slug: 'pyramid-chart',
    recipe: pyramidChart,
    propsInterface: 'PyramidChartProps',
    sample: { data: [{ tier: 'Apex', pct: 20, t: 1 }, { tier: 'Base', pct: 90, t: 3 }], labelKey: 'tier', widthKey: 'pct', toneKey: 't' },
  }),
  entry({
    chart: 'HeatmapChart',
    req: 'REQ-084',
    slug: 'heatmap-chart',
    recipe: heatmapChart,
    propsInterface: 'HeatmapChartProps',
    sample: { data: [{ row: 'Mon', vals: [10, 50, 90] }, { row: 'Tue', vals: [0, 30, 100] }], labelKey: 'row', valuesKey: 'vals', scaleMax: 120 },
  }),
  entry({
    chart: 'TreemapChart',
    req: 'REQ-085',
    slug: 'treemap-chart',
    recipe: treemapChart,
    propsInterface: 'TreemapChartProps',
    sample: {
      data: [{ name: 'A', pc: 60, cols: 3, rows: 2 }, { name: 'B', pc: 40, cols: 2, rows: 2, tone: 1 }],
      labelKey: 'name',
      shareKey: 'pc',
      columns: 5,
      rows: 2,
    },
  }),
  entry({
    chart: 'SankeyChart',
    req: 'REQ-086',
    slug: 'sankey-chart',
    recipe: sankeyChart,
    propsInterface: 'SankeyChartProps',
    sample: { data: [{ a: 'Web', b: 'Signup', n: 60 }, { a: 'Ads', b: 'Signup', n: 40 }, { a: 'Signup', b: 'Paid', n: 30 }], sourceKey: 'a', targetKey: 'b', valueKey: 'n' },
  }),
  entry({
    chart: 'ActivityGrid',
    req: 'REQ-087',
    slug: 'activity-grid',
    recipe: activityGrid,
    propsInterface: 'ActivityGridProps',
    sample: {
      data: Array.from({ length: 14 }, (_, i) => ({ d: `2026-06-${String(i + 1).padStart(2, '0')}`, n: i, l: i % 5 })),
      dateKey: 'd',
      countKey: 'n',
      levelKey: 'l',
      weeks: 2,
    },
  }),
];

/** The charts added in Phase 1, which every adapter publishes alongside the line chart. */
export const PHASE_1: readonly CatalogEntry[] = CATALOG.filter((c) => c.chart !== 'LineChart');

export function catalogEntry(chart: string): CatalogEntry {
  const found = CATALOG.find((c) => c.chart === chart);
  if (!found) throw new Error(`No catalog entry for ${chart}`);
  return found;
}
