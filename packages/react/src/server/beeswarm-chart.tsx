import { beeswarmChart } from '@silverpoint/core/catalog';
import type { BeeswarmChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerBeeswarmChartProps = ServerChartProps<BeeswarmChartProps>;

/** `BeeswarmChart` for React Server Components and static rendering (API Spec §8.1). */
export const BeeswarmChart = createServerChart<BeeswarmChartProps>(beeswarmChart);
