import type { Datum } from '../../types';

/**
 * Demo dataset of `PyramidChart` (REQ-093), in the default field names of Data Model §2.9.
 * Frozen and part of the stable surface (Data Model §4).
 */
export const PYRAMID_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { label: 'Leads', width: 18 },
    { label: 'Managers', width: 42 },
    { label: 'Specialists', width: 70 },
    { label: 'Staff', width: 100 },
  ].map((row) => Object.freeze(row)),
);
