import type { Datum } from '../../types';

/** Demo dataset of `BarChart` (REQ-093): orders per quarter against last year. Frozen (Data Model §4). */
export const BAR_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { x: 'Q1', value: 42, previous: 35 },
    { x: 'Q2', value: 58, previous: 44 },
    { x: 'Q3', value: 51, previous: 49 },
    { x: 'Q4', value: 73, previous: 60 },
  ].map((row) => Object.freeze(row)),
);

export const BAR_CHART_DEMO_KEYS = /* @__PURE__ */ Object.freeze({ xKey: 'x', valueKey: 'value', secondaryKey: 'previous' } as const);
