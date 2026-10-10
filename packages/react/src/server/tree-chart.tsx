import { treeChart } from '@silverpoint/core/catalog';
import type { TreeChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerTreeChartProps = ServerChartProps<TreeChartProps>;

/** `TreeChart` for React Server Components and static rendering (API Spec §8.1). */
export const TreeChart = createServerChart<TreeChartProps>(treeChart);
