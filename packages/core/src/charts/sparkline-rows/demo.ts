import type { Datum } from '../../types';

/** Demo dataset of `SparklineRows` (REQ-093): service health, one row each (delta-008). Frozen. */
export const SPARKLINE_ROWS_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { name: 'API', readout: '99.9%', points: Object.freeze([98, 99, 99, 97, 99, 100, 99, 100]) },
    { name: 'Queue', points: Object.freeze([12, 18, 15, 22, 19, 25, 21, 17]) },
    { name: 'Cache', readout: '84%', points: Object.freeze([70, 72, 78, 75, 80, 83, 81, 84]) },
    { name: 'Search', points: Object.freeze([240, 220, 260, 210, 190, 205, 180, 170]) },
  ].map((row) => Object.freeze(row)),
);
