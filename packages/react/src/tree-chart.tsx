import { treeChart } from '@silverpoint/core/catalog';
import type { TreeChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { TreeChartProps } from '@silverpoint/core';

export type ClientTreeChartProps = TreeChartProps & InteractionProps;

/** `TreeChart` (REQ-418): a tidy node-link tree (API Spec §7.3). */
export const TreeChart = createClientChart<TreeChartProps>(treeChart);
