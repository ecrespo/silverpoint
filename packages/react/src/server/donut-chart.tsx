import { donutChart, type DonutChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerDonutChartProps = ServerChartProps<DonutChartProps>;

/** `DonutChart` for React Server Components and static rendering (API Spec §8.1). */
export const DonutChart = createServerChart<DonutChartProps>(donutChart);
