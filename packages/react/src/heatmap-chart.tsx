import { heatmapChart, type HeatmapChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { HeatmapChartProps } from '@silverpoint/core';

export type ClientHeatmapChartProps = HeatmapChartProps & InteractionProps;

/** `HeatmapChart` (REQ-084): labelled rows of cells, toned by value and printed (API Spec §7). */
export const HeatmapChart = createClientChart<HeatmapChartProps>(heatmapChart);
