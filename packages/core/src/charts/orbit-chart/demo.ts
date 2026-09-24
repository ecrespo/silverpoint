import type { Datum } from '../../types';

/**
 * Demo dataset of `OrbitChart` (REQ-093): three years of releases, one orbit per year from the
 * inside out, each release at its day of the year (0-1) and sized by the changes it shipped.
 * Frozen (Data Model §4).
 */
export const ORBIT_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { label: '2023', markers: Object.freeze([Object.freeze({ period: 0.08, value: 12 }), Object.freeze({ period: 0.33, value: 30 }), Object.freeze({ period: 0.61, value: 18 }), Object.freeze({ period: 0.9, value: 24 })]) },
    { label: '2024', markers: Object.freeze([Object.freeze({ period: 0.12, value: 20 }), Object.freeze({ period: 0.4, value: 42 }), Object.freeze({ period: 0.66, value: 15 }), Object.freeze({ period: 0.87, value: 33 })]) },
    { label: '2025', markers: Object.freeze([Object.freeze({ period: 0.05, value: 26 }), Object.freeze({ period: 0.29, value: 38 }), Object.freeze({ period: 0.55, value: 50 }), Object.freeze({ period: 0.81, value: 21 })]) },
  ].map((row) => Object.freeze(row)),
);
