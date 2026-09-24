import type { Datum } from '../../types';

/** Demo dataset of `RadarChart` (REQ-093): a product scored on six criteria. Frozen (Data Model §4). */
export const RADAR_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { subject: 'Speed', value: 8 },
    { subject: 'Range', value: 6 },
    { subject: 'Comfort', value: 7 },
    { subject: 'Safety', value: 9 },
    { subject: 'Cost', value: 4 },
    { subject: 'Style', value: 6 },
  ].map((row) => Object.freeze(row)),
);
