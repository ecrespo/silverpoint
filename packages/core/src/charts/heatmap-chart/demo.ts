import type { Datum } from '../../types';

/**
 * Demo dataset of `HeatmapChart` (REQ-093), in the default field names of Data Model §2.4.
 * Frozen and part of the stable surface (Data Model §4).
 */
export const HEATMAP_CHART_DEMO: readonly Datum[] = Object.freeze(
  [
    { label: 'Mon', values: Object.freeze([12, 34, 58, 71, 66, 40]) },
    { label: 'Tue', values: Object.freeze([18, 42, 77, 88, 70, 35]) },
    { label: 'Wed', values: Object.freeze([9, 38, 64, 93, 81, 47]) },
    { label: 'Thu', values: Object.freeze([15, 29, 55, 68, 59, 31]) },
    { label: 'Fri', values: Object.freeze([6, 21, 43, 49, 37, 14]) },
  ].map((row) => Object.freeze(row)),
);
