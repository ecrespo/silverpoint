import { barChart, type BarChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { BarChartProps } from '@silverpoint/core';

export type ClientBarChartProps = BarChartProps & InteractionProps;

/** `BarChart` (REQ-064): pill bars, columns or rows (API Spec §7). */
export const BarChart = createClientChart<BarChartProps>(barChart);
