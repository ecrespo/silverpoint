import type { Datum } from '../../types';

/** Demo dataset of `FunnelChart` (REQ-093): a checkout funnel. Frozen (Data Model §4). */
export const FUNNEL_CHART_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ [
    { stage: 'Visits', value: 12400 },
    { stage: 'Product', value: 6800 },
    { stage: 'Cart', value: 2900 },
    { stage: 'Checkout', value: 1500 },
    { stage: 'Paid', value: 980 },
  ].map((row) => Object.freeze(row)),
);
