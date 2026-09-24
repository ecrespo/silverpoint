import { polarBarChart, type PolarBarChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerPolarBarChartProps = ServerChartProps<PolarBarChartProps>;

/** `PolarBarChart` for React Server Components and static rendering (API Spec §8.1). */
export const PolarBarChart = createServerChart<PolarBarChartProps>(polarBarChart);
