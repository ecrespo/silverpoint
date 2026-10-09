import { intervalChart } from '@silverpoint/core/catalog';
import type { IntervalChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { IntervalChartProps } from '@silverpoint/core';

export type ClientIntervalChartProps = IntervalChartProps & InteractionProps;

/** `IntervalChart` (REQ-411): floating bars from start to end on lanes (API Spec §7.3). */
export const IntervalChart = createClientChart<IntervalChartProps>(intervalChart);
