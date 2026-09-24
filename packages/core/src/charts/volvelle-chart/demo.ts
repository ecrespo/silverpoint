import type { Datum } from '../../types';

/**
 * Demo dataset of `VolvelleChart` (REQ-093): an on-call wheel — the day, the shift and the team
 * that covers it, read against one index as on a paper volvelle. Frozen (Data Model §4).
 */
export const VOLVELLE_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { label: 'Day', segments: Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) },
    { label: 'Shift', segments: Object.freeze(['Early', 'Late', 'Night']) },
    { label: 'Team', segments: Object.freeze(['Atlas', 'Borealis', 'Cygnus', 'Draco', 'Eridanus']) },
  ].map((row) => Object.freeze(row)),
);
