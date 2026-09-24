import { barChart, type BarChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerBarChartProps = ServerChartProps<BarChartProps>;

/** `BarChart` for React Server Components and static rendering (API Spec §8.1). */
export const BarChart = createServerChart<BarChartProps>(barChart);
