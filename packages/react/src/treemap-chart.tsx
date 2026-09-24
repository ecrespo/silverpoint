import { treemapChart, type TreemapChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { TreemapChartProps } from '@silverpoint/core';

export type ClientTreemapChartProps = TreemapChartProps & InteractionProps;

/** `TreemapChart` (REQ-085): tiles placed first-fit in a declared grid (API Spec §7). */
export const TreemapChart = createClientChart<TreemapChartProps>(treemapChart);
