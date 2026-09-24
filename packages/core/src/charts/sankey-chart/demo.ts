import type { Datum } from '../../types';

/**
 * Demo dataset of `SankeyChart` (REQ-093), in the default field names of Data Model §2.7.
 * Frozen and part of the stable surface (Data Model §4).
 */
export const SANKEY_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { source: 'Search', target: 'Visit', value: 48 },
    { source: 'Social', target: 'Visit', value: 27 },
    { source: 'Email', target: 'Visit', value: 15 },
    { source: 'Visit', target: 'Signup', value: 42 },
    { source: 'Visit', target: 'Bounce', value: 48 },
    { source: 'Signup', target: 'Paid', value: 18 },
  ].map((row) => Object.freeze(row)),
);
