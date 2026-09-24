import { sankeyChart, type SankeyChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerSankeyChartProps = ServerChartProps<SankeyChartProps>;

/** `SankeyChart` for React Server Components and static rendering (API Spec §8.1). */
export const SankeyChart = createServerChart<SankeyChartProps>(sankeyChart);
