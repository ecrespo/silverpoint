import type { Datum } from '../../types';

/** Demo dataset of `StepChart` (REQ-093): a price tier over the year. Frozen (Data Model §4). */
export const STEP_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { x: 'Jan', value: 12 },
    { x: 'Feb', value: 12 },
    { x: 'Mar', value: 18 },
    { x: 'Apr', value: 18 },
    { x: 'May', value: 15 },
    { x: 'Jun', value: 24 },
    { x: 'Jul', value: 24 },
    { x: 'Aug', value: 30 },
  ].map((row) => Object.freeze(row)),
);
