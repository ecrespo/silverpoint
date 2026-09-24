import type { Datum } from '../../types';

/** Demo dataset of `StackedBarChart` (REQ-093): signups by plan per month. Frozen (Data Model §4). */
export const STACKED_BAR_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { x: 'Jan', free: 40, pro: 18, team: 6 },
    { x: 'Feb', free: 46, pro: 21, team: 9 },
    { x: 'Mar', free: 38, pro: 26, team: 11 },
    { x: 'Apr', free: 52, pro: 24, team: 14 },
    { x: 'May', free: 49, pro: 31, team: 15 },
  ].map((row) => Object.freeze(row)),
);

export const STACKED_BAR_CHART_DEMO_KEYS: readonly string[] = /* @__PURE__ */ Object.freeze(['free', 'pro', 'team']);
