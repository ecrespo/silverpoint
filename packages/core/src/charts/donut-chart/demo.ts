import type { Datum } from '../../types';

/** Demo dataset of `DonutChart` (REQ-093): a household budget. Frozen (Data Model §4). */
export const DONUT_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { name: 'Rent', value: 38 },
    { name: 'Food', value: 22 },
    { name: 'Savings', value: 15 },
    { name: 'Transport', value: 14 },
    { name: 'Leisure', value: 11 },
  ].map((row) => Object.freeze(row)),
);
