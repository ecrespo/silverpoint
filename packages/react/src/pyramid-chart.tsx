import { pyramidChart, type PyramidChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { PyramidChartProps } from '@silverpoint/core';

export type ClientPyramidChartProps = PyramidChartProps & InteractionProps;

/** `PyramidChart` (REQ-070): stacked, centred tiers whose width encodes the value (API Spec §7). */
export const PyramidChart = createClientChart<PyramidChartProps>(pyramidChart);
