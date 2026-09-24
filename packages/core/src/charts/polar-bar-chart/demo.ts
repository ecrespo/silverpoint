import type { Datum } from '../../types';

/** Demo dataset of `PolarBarChart` (REQ-093): a year of monthly sales. Frozen (Data Model §4). */
export const POLAR_BAR_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { name: 'Jan', value: 32 },
    { name: 'Feb', value: 28 },
    { name: 'Mar', value: 41 },
    { name: 'Apr', value: 47 },
    { name: 'May', value: 55 },
    { name: 'Jun', value: 61 },
    { name: 'Jul', value: 66 },
    { name: 'Aug', value: 63 },
    { name: 'Sep', value: 52 },
    { name: 'Oct', value: 44 },
    { name: 'Nov', value: 37 },
    { name: 'Dec', value: 49 },
  ].map((row) => Object.freeze(row)),
);
