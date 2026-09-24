import type { Datum } from '../../types';

/** Demo dataset of `CandlestickChart` (REQ-093): ten sessions of a price. Frozen (Data Model §4). */
export const CANDLESTICK_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { time: 'Mon', open: 102, high: 108, low: 99, close: 106 },
    { time: 'Tue', open: 106, high: 109, low: 101, close: 103 },
    { time: 'Wed', open: 103, high: 105, low: 97, close: 99 },
    { time: 'Thu', open: 99, high: 104, low: 96, close: 103 },
    { time: 'Fri', open: 103, high: 111, low: 102, close: 110 },
    { time: 'Mon', open: 110, high: 114, low: 107, close: 108 },
    { time: 'Tue', open: 108, high: 110, low: 104, close: 109 },
    { time: 'Wed', open: 109, high: 116, low: 108, close: 115 },
  ].map((row) => Object.freeze(row)),
);
