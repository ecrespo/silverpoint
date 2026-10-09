import { violinChart } from '@silverpoint/core/catalog';
import type { ViolinChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerViolinChartProps = ServerChartProps<ViolinChartProps>;

/** `ViolinChart` for React Server Components and static rendering (API Spec §8.1). */
export const ViolinChart = createServerChart<ViolinChartProps>(violinChart);
