import { polarLineChart } from '@silverpoint/core/catalog';
import type { PolarLineChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerPolarLineChartProps = ServerChartProps<PolarLineChartProps>;

/** `PolarLineChart` for React Server Components and static rendering (API Spec §8.1). */
export const PolarLineChart = createServerChart<PolarLineChartProps>(polarLineChart);
