import { funnelChart, type FunnelChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerFunnelChartProps = ServerChartProps<FunnelChartProps>;

/** `FunnelChart` for React Server Components and static rendering (API Spec §8.1). */
export const FunnelChart = createServerChart<FunnelChartProps>(funnelChart);
