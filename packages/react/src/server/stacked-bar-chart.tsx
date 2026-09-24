import { stackedBarChart, type StackedBarChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerStackedBarChartProps = ServerChartProps<StackedBarChartProps>;

/** `StackedBarChart` for React Server Components and static rendering (API Spec §8.1). */
export const StackedBarChart = createServerChart<StackedBarChartProps>(stackedBarChart);
