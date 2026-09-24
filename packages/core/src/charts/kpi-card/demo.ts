import type { Datum } from '../../types';

/** Demo dataset of `KpiCard` (REQ-093): daily orders over two weeks. Frozen (Data Model §4). */
export const KPI_CARD_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [118, 124, 121, 132, 140, 136, 129, 142, 151, 147, 155, 162, 158, 171].map((value) => Object.freeze({ value })),
);

export const KPI_CARD_DEMO_PROPS = /* @__PURE__ */ Object.freeze({ metric: 'orders per day', delta: 8.2 } as const);
