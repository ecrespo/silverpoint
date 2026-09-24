import { pyramidChart, type PyramidChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerPyramidChartProps = ServerChartProps<PyramidChartProps>;

/** `PyramidChart` for React Server Components and static rendering (API Spec §8.1). */
export const PyramidChart = createServerChart<PyramidChartProps>(pyramidChart);
