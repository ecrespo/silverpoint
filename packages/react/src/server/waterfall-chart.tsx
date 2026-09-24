import { waterfallChart, type WaterfallChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerWaterfallChartProps = ServerChartProps<WaterfallChartProps>;

/** `WaterfallChart` for React Server Components and static rendering (API Spec §8.1). */
export const WaterfallChart = createServerChart<WaterfallChartProps>(waterfallChart);
