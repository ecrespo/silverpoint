import type { Datum } from '../../types';

/** Demo dataset of `WaterfallChart` (REQ-093): from opening to closing cash. Frozen (Data Model §4). */
export const WATERFALL_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { step: 'Opening', base: 120 },
    { step: 'Sales', delta: 64 },
    { step: 'Services', delta: 22 },
    { step: 'Payroll', delta: -58 },
    { step: 'Rent', delta: -24 },
    { step: 'Closing', base: 124 },
  ].map((row) => Object.freeze(row)),
);
