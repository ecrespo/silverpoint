import { polarBarChart, type PolarBarChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { PolarBarChartProps } from '@silverpoint/core';

export type ClientPolarBarChartProps = PolarBarChartProps & InteractionProps;

/** `PolarBarChart` (REQ-077): 360° bars, length ∝ value (API Spec §7). */
export const PolarBarChart = createClientChart<PolarBarChartProps>(polarBarChart);
