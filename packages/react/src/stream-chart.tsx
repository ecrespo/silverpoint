import { streamChart, type StreamChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { StreamChartProps } from '@silverpoint/core';

export type ClientStreamChartProps = StreamChartProps & InteractionProps;

/** `StreamChart` (REQ-074): two waves, overlaid or stacked (API Spec §7). */
export const StreamChart = createClientChart<StreamChartProps>(streamChart);
