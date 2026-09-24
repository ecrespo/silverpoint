import { stepChart, type StepChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { StepChartProps } from '@silverpoint/core';

export type ClientStepChartProps = StepChartProps & InteractionProps;

/** `StepChart` (REQ-061): a series drawn as exact steps (API Spec §7). */
export const StepChart = createClientChart<StepChartProps>(stepChart);
