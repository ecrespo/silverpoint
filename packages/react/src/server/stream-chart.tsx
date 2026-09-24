import { streamChart, type StreamChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerStreamChartProps = ServerChartProps<StreamChartProps>;

/** `StreamChart` for React Server Components and static rendering (API Spec §8.1). */
export const StreamChart = createServerChart<StreamChartProps>(streamChart);
