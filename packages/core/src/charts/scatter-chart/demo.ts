import type { Datum } from '../../types';

/** Demo dataset of `ScatterChart` (REQ-093): height against weight. Frozen (Data Model §4). */
export const SCATTER_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { x: 152, y: 51, size: 2 },
    { x: 158, y: 56, size: 4 },
    { x: 161, y: 54, size: 3 },
    { x: 165, y: 62, size: 6 },
    { x: 168, y: 60, size: 5 },
    { x: 171, y: 68, size: 8 },
    { x: 175, y: 71, size: 7 },
    { x: 178, y: 69, size: 9 },
    { x: 182, y: 77, size: 10 },
  ].map((row) => Object.freeze(row)),
);
