import { stackedBarChart, type StackedBarChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { StackedBarChartProps } from '@silverpoint/core';

export type ClientStackedBarChartProps = StackedBarChartProps & InteractionProps;

/** `StackedBarChart` (REQ-065): one stacked segment per key (API Spec §7). */
export const StackedBarChart = createClientChart<StackedBarChartProps>(stackedBarChart);
