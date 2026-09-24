import type { Datum } from '../../types';

/** Demo dataset of `CoxcombChart` (REQ-093): support tickets by weekday. Frozen (Data Model §4). */
export const COXCOMB_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { name: 'Mon', value: 42 },
    { name: 'Tue', value: 35 },
    { name: 'Wed', value: 31 },
    { name: 'Thu', value: 38 },
    { name: 'Fri', value: 27 },
    { name: 'Sat', value: 12 },
    { name: 'Sun', value: 9 },
  ].map((row) => Object.freeze(row)),
);
