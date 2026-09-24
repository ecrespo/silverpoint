import { waterfallChart, type WaterfallChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { WaterfallChartProps } from '@silverpoint/core';

export type ClientWaterfallChartProps = WaterfallChartProps & InteractionProps;

/** `WaterfallChart` (REQ-067): totals and floating deltas (API Spec §7). */
export const WaterfallChart = createClientChart<WaterfallChartProps>(waterfallChart);
