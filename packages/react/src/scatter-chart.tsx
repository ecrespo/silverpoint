import { scatterChart, type ScatterChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ScatterChartProps } from '@silverpoint/core';

export type ClientScatterChartProps = ScatterChartProps & InteractionProps;

/** `ScatterChart` (REQ-082): points on two linear scales (API Spec §7). */
export const ScatterChart = createClientChart<ScatterChartProps>(scatterChart);
