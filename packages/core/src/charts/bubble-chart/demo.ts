import type { Datum } from '../../types';

/** Demo dataset of `BubbleChart` (REQ-093): markets by growth, margin and size. Frozen (Data Model §4). */
export const BUBBLE_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { x: 2, y: 18, size: 40 },
    { x: 5, y: 24, size: 120 },
    { x: 8, y: 12, size: 65 },
    { x: 11, y: 30, size: 210 },
    { x: 14, y: 21, size: 90 },
  ].map((row) => Object.freeze(row)),
);
