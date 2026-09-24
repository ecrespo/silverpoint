import { treemapChart, type TreemapChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerTreemapChartProps = ServerChartProps<TreemapChartProps>;

/** `TreemapChart` for React Server Components and static rendering (API Spec §8.1). */
export const TreemapChart = createServerChart<TreemapChartProps>(treemapChart);
