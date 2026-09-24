import { composedChart, type ComposedChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ComposedChartProps } from '@silverpoint/core';

export type ClientComposedChartProps = ComposedChartProps & InteractionProps;

/** `ComposedChart` (REQ-066): columns and a spline on one scale (API Spec §7). */
export const ComposedChart = createClientChart<ComposedChartProps>(composedChart);
