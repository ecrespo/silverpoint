import type { Datum } from '../../types';

/** Demo dataset of `RadialRings` (REQ-093): daily goals, percent reached. Frozen (Data Model §4). */
export const RADIAL_RINGS_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { name: 'Move', value: 82 },
    { name: 'Exercise', value: 64 },
    { name: 'Stand', value: 100 },
  ].map((row) => Object.freeze(row)),
);
