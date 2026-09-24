import type { Datum } from '../../types';

/** Demo dataset of `RadialArcGroup` (REQ-093): a sales pipeline by channel. Frozen (Data Model §4). */
export const RADIAL_ARC_GROUP_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { name: 'Direct', value: 84 },
    { name: 'Partners', value: 62 },
    { name: 'Online', value: 47 },
    { name: 'Events', value: 23 },
  ].map((row) => Object.freeze(row)),
);
