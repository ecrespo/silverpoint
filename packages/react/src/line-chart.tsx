import { lineChart, type LineChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';

export type ClientLineChartProps = LineChartProps & InteractionProps;

/** `LineChart` (REQ-060): spline with a dotted baseline series (API Spec §7). */
export const LineChart = createClientChart<LineChartProps>(lineChart);
