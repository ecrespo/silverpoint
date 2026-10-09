import { divergingBarChart } from '@silverpoint/core/catalog';
import type { DivergingBarChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { DivergingBarChartProps } from '@silverpoint/core';

export type ClientDivergingBarChartProps = DivergingBarChartProps & InteractionProps;

/** `DivergingBarChart` (REQ-412): ordered levels stacked on both sides of a neutral centre (API Spec §7.3). */
export const DivergingBarChart = createClientChart<DivergingBarChartProps>(divergingBarChart);
