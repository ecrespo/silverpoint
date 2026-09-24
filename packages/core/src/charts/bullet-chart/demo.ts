import type { Datum } from '../../types';

/**
 * Demo dataset of `BulletChart` (REQ-093), in the default field names of Data Model §2.9.
 * Frozen and part of the stable surface (Data Model §4).
 */
export const BULLET_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { title: 'Revenue', actual: 72, target: 80 },
    { title: 'Profit', actual: 58, target: 65 },
    { title: 'New users', actual: 86, target: 75 },
    { title: 'Retention', actual: 41, target: 60 },
  ].map((row) => Object.freeze(row)),
);
