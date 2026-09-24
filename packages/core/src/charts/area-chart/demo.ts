import type { Datum } from '../../types';

/** Demo dataset of `AreaChart` (REQ-093): sessions per weekday. Frozen (Data Model §4). */
export const AREA_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { x: 'Mon', value: 32 },
    { x: 'Tue', value: 45 },
    { x: 'Wed', value: 41 },
    { x: 'Thu', value: 58 },
    { x: 'Fri', value: 66 },
    { x: 'Sat', value: 38 },
    { x: 'Sun', value: 29 },
  ].map((row) => Object.freeze(row)),
);
