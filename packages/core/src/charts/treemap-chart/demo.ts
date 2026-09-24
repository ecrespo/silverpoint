import type { Datum } from '../../types';

/**
 * Demo dataset of `TreemapChart` (REQ-093), in the field names of Data Model §2.5; it fills
 * the default 6 × 4 grid exactly. Frozen and part of the stable surface (Data Model §4).
 */
export const TREEMAP_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { label: 'Search', share: 48, cols: 3, rows: 4 },
    { label: 'Direct', share: 26, cols: 3, rows: 2 },
    { label: 'Social', share: 17, cols: 2, rows: 2 },
    { label: 'Email', share: 9, cols: 1, rows: 2 },
  ].map((row) => Object.freeze(row)),
);
