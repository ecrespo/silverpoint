import { lineChart, type LineChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerLineChartProps = ServerChartProps<LineChartProps>;

/** `LineChart` for React Server Components and static rendering (API Spec §8.1). */
export const LineChart = createServerChart<LineChartProps>(lineChart);
