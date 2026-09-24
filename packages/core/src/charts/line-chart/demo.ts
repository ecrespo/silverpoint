import type { Datum } from '../../types';

/**
 * Demo dataset of `LineChart` (REQ-093). Frozen, and part of the stable surface: changing it
 * alters the SVG of anyone who renders without data, so it is never a patch (Data Model §4).
 */
export const LINE_CHART_DEMO: readonly Datum[] = Object.freeze(
  [
    { hour: '00', hits: 18, baseline: 22 },
    { hour: '02', hits: 14, baseline: 18 },
    { hour: '04', hits: 11, baseline: 15 },
    { hour: '06', hits: 16, baseline: 17 },
    { hour: '08', hits: 34, baseline: 30 },
    { hour: '10', hits: 58, baseline: 48 },
    { hour: '12', hits: 71, baseline: 60 },
    { hour: '14', hits: 66, baseline: 62 },
    { hour: '16', hits: 74, baseline: 64 },
    { hour: '18', hits: 88, baseline: 70 },
    { hour: '20', hits: 62, baseline: 55 },
    { hour: '22', hits: 41, baseline: 40 },
  ].map((row) => Object.freeze(row)),
);

export const LINE_CHART_DEMO_KEYS = Object.freeze({
  xKey: 'hour',
  valueKey: 'hits',
  secondaryKey: 'baseline',
} as const);
