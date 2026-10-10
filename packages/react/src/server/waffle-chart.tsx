import { waffleChart } from '@silverpoint/core/catalog';
import type { WaffleChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerWaffleChartProps = ServerChartProps<WaffleChartProps>;

/** `WaffleChart` for React Server Components and static rendering (API Spec §8.1). */
export const WaffleChart = createServerChart<WaffleChartProps>(waffleChart);
