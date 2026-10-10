import { delaunayChart } from '@silverpoint/core/catalog';
import type { DelaunayChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerDelaunayChartProps = ServerChartProps<DelaunayChartProps>;

/** `DelaunayChart` for React Server Components and static rendering (API Spec §8.1). */
export const DelaunayChart = createServerChart<DelaunayChartProps>(delaunayChart);
