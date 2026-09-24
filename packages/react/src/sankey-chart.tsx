import { sankeyChart, type SankeyChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { SankeyChartProps } from '@silverpoint/core';

export type ClientSankeyChartProps = SankeyChartProps & InteractionProps;

/** `SankeyChart` (REQ-086): flow bands between layered nodes (API Spec §7). */
export const SankeyChart = createClientChart<SankeyChartProps>(sankeyChart);
