import type { Datum } from '../../types';

/** Demo dataset of `ComposedChart` (REQ-093): revenue and margin per month. Frozen (Data Model §4). */
export const COMPOSED_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { x: 'Jan', revenue: 42, margin: 18 },
    { x: 'Feb', revenue: 48, margin: 21 },
    { x: 'Mar', revenue: 39, margin: 17 },
    { x: 'Apr', revenue: 55, margin: 26 },
    { x: 'May', revenue: 61, margin: 30 },
    { x: 'Jun', revenue: 58, margin: 27 },
  ].map((row) => Object.freeze(row)),
);

export const COMPOSED_CHART_DEMO_KEYS = /* @__PURE__ */ Object.freeze({ xKey: 'x', barKey: 'revenue', lineKey: 'margin' } as const);
