import { rangeBandChart, type RangeBandChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { RangeBandChartProps } from '@silverpoint/core';

export type ClientRangeBandChartProps = RangeBandChartProps & InteractionProps;

/** `RangeBandChart` (REQ-073): the band between a low and a high series (API Spec §7). */
export const RangeBandChart = createClientChart<RangeBandChartProps>(rangeBandChart);
