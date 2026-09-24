import { bubbleChart, type BubbleChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { BubbleChartProps } from '@silverpoint/core';

export type ClientBubbleChartProps = BubbleChartProps & InteractionProps;

/** `BubbleChart` (REQ-083): circles whose area encodes size (API Spec §7). */
export const BubbleChart = createClientChart<BubbleChartProps>(bubbleChart);
