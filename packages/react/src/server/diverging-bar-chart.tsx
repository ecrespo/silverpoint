import { divergingBarChart } from '@silverpoint/core/catalog';
import type { DivergingBarChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerDivergingBarChartProps = ServerChartProps<DivergingBarChartProps>;

/** `DivergingBarChart` for React Server Components and static rendering (API Spec §8.1). */
export const DivergingBarChart = createServerChart<DivergingBarChartProps>(divergingBarChart);
