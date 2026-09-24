import { areaChart, type AreaChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerAreaChartProps = ServerChartProps<AreaChartProps>;

/** `AreaChart` for React Server Components and static rendering (API Spec §8.1). */
export const AreaChart = createServerChart<AreaChartProps>(areaChart);
