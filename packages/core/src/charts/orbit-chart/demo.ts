import type { Datum } from '../../types';

const release = (period: number, value: number) => Object.freeze({ period, value });

/**
 * Demo dataset of `OrbitChart` (REQ-093): three years of releases, one orbit per year from the
 * inside out, each release at its day of the year (0-1) and sized by the changes it shipped.
 * Frozen (Data Model §4).
 */
export const ORBIT_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { label: '2023', markers: Object.freeze([release(0.08, 12), release(0.33, 30), release(0.61, 18), release(0.9, 24)]) },
    { label: '2024', markers: Object.freeze([release(0.12, 20), release(0.4, 42), release(0.66, 15), release(0.87, 33)]) },
    { label: '2025', markers: Object.freeze([release(0.05, 26), release(0.29, 38), release(0.55, 50), release(0.81, 21)]) },
  ].map((row) => Object.freeze(row)),
);
