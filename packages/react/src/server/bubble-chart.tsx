import { bubbleChart, type BubbleChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerBubbleChartProps = ServerChartProps<BubbleChartProps>;

/** `BubbleChart` for React Server Components and static rendering (API Spec §8.1). */
export const BubbleChart = createServerChart<BubbleChartProps>(bubbleChart);
