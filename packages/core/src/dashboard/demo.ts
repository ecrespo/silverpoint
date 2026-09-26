import type { CommonChartProps } from '../types';
import type { DashboardProps } from './types';

/** One child of a reference dashboard: the catalog chart it holds, by name, and its props. */
export interface DashboardDemoChild {
  readonly cell: string;
  /** A catalog chart name (`LineChart`); each adapter maps it to its own component. */
  readonly chart: string;
  /** Props only: every chart renders its demo data (REQ-093), so no child carries rows. */
  readonly props: Readonly<CommonChartProps & Record<string, unknown>>;
}

/** A reference dashboard: plain data, frozen (I-9), shared by fixtures, examples and docs. */
export interface DashboardDemo {
  readonly props: DashboardProps;
  readonly children: readonly DashboardDemoChild[];
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const inner of Object.values(value)) deepFreeze(inner);
    Object.freeze(value);
  }
  return value;
}

const kpi = (cell: string, title: string, metric: string, delta: number): DashboardDemoChild => ({ cell, chart: 'KpiCard', props: { title, metric, delta } });

/**
 * The reference dashboards of Data Model §4. `ops` is the DD-007 weight reference; `mixed-spans`
 * leaves a row-end gap at `md` to prove that cells are never reordered (REQ-203). Spans are given
 * per breakpoint, so none is clamped at `sm`.
 */
export const DASHBOARD_DEMOS = /* @__PURE__ */ deepFreeze({
  'kpi-strip': {
    props: {
      id: 'kpi-strip',
      title: 'This week',
      layout: { cells: [{ id: 'revenue' }, { id: 'orders' }, { id: 'users' }, { id: 'refunds' }, { id: 'trend', colSpan: { md: 2, lg: 4 } }] },
    },
    children: [
      kpi('revenue', 'Revenue', 'thousands', 6.4),
      kpi('orders', 'Orders', 'orders per day', 8.2),
      kpi('users', 'Active users', 'hundreds', 2.1),
      kpi('refunds', 'Refunds', 'per day', -1.5),
      { cell: 'trend', chart: 'LineChart', props: { title: 'Hits per hour' } },
    ],
  },
  ops: {
    props: {
      id: 'ops',
      title: 'Operations',
      description: 'Service health over the last day: headline figures, traffic, errors and load.',
      link: { key: 'hour' },
      layout: {
        cells: [
          { id: 'revenue' },
          { id: 'users' },
          { id: 'churn' },
          { id: 'nps' },
          { id: 'traffic', colSpan: { md: 2, lg: 3 }, rowSpan: 2 },
          { id: 'errors' },
          { id: 'share' },
          { id: 'load', colSpan: { md: 2, lg: 2 } },
          { id: 'hosts' },
          { id: 'uptime' },
          { id: 'activity', colSpan: { md: 2, lg: 2 } },
          { id: 'capacity' },
        ],
      },
    },
    children: [
      kpi('revenue', 'Revenue', 'thousands', 6.4),
      kpi('users', 'Active users', 'hundreds', 2.1),
      kpi('churn', 'Churn', 'per cent', -0.4),
      kpi('nps', 'NPS', 'points', 3),
      { cell: 'traffic', chart: 'LineChart', props: { title: 'Traffic', footerLeft: 'hits per hour', footerRight: 'last 24 h' } },
      { cell: 'errors', chart: 'BarChart', props: { title: 'Errors' } },
      { cell: 'share', chart: 'DonutChart', props: { title: 'Traffic share' } },
      { cell: 'load', chart: 'HeatmapChart', props: { title: 'Load by hour' } },
      { cell: 'hosts', chart: 'SparklineRows', props: { title: 'Hosts' } },
      { cell: 'uptime', chart: 'GaugeArc', props: { title: 'Uptime' } },
      { cell: 'activity', chart: 'ActivityGrid', props: { title: 'Deploys' } },
      { cell: 'capacity', chart: 'MeterChart', props: { title: 'Capacity' } },
    ],
  },
  'mixed-spans': {
    props: {
      id: 'mixed-spans',
      title: 'Mixed spans',
      layout: {
        columns: { lg: 3 },
        cells: [
          { id: 'one' },
          { id: 'two', colSpan: { md: 2, lg: 2 } },
          { id: 'three' },
          { id: 'four', colSpan: { md: 2, lg: 3 } },
          { id: 'five' },
          { id: 'six', colSpan: { md: 2, lg: 2 } },
          { id: 'seven' },
        ],
      },
    },
    children: [
      { cell: 'one', chart: 'StepChart', props: { title: 'Step' } },
      { cell: 'two', chart: 'AreaChart', props: { title: 'Area' } },
      { cell: 'three', chart: 'FunnelChart', props: { title: 'Funnel' } },
      { cell: 'four', chart: 'BarChart', props: { title: 'Bars' } },
      { cell: 'five', chart: 'RadarChart', props: { title: 'Radar' } },
      { cell: 'six', chart: 'StreamChart', props: { title: 'Stream' } },
      { cell: 'seven', chart: 'MeterChart', props: { title: 'Meter' } },
    ],
  },
} satisfies Record<string, DashboardDemo>);
