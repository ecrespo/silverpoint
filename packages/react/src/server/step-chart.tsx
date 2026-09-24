import { stepChart, type StepChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerStepChartProps = ServerChartProps<StepChartProps>;

/** `StepChart` for React Server Components and static rendering (API Spec §8.1). */
export const StepChart = createServerChart<StepChartProps>(stepChart);
