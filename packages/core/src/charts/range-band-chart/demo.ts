import type { Datum } from '../../types';

/** Demo dataset of `RangeBandChart` (REQ-093): daily temperature range. Frozen (Data Model §4). */
export const RANGE_BAND_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { x: 'Mon', low: 11, high: 19 },
    { x: 'Tue', low: 12, high: 22 },
    { x: 'Wed', low: 14, high: 24 },
    { x: 'Thu', low: 13, high: 21 },
    { x: 'Fri', low: 10, high: 18 },
    { x: 'Sat', low: 9, high: 20 },
    { x: 'Sun', low: 12, high: 23 },
  ].map((row) => Object.freeze(row)),
);
