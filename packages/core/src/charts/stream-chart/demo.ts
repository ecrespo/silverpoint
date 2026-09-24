import type { Datum } from '../../types';

/** Demo dataset of `StreamChart` (REQ-093): two traffic sources over a week. Frozen (Data Model §4). */
export const STREAM_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { x: 'Mon', organic: 22, paid: 14 },
    { x: 'Tue', organic: 28, paid: 18 },
    { x: 'Wed', organic: 35, paid: 16 },
    { x: 'Thu', organic: 31, paid: 24 },
    { x: 'Fri', organic: 38, paid: 29 },
    { x: 'Sat', organic: 26, paid: 21 },
    { x: 'Sun', organic: 19, paid: 12 },
  ].map((row) => Object.freeze(row)),
);

export const STREAM_CHART_DEMO_KEYS: readonly string[] = /* @__PURE__ */ Object.freeze(['organic', 'paid']);
