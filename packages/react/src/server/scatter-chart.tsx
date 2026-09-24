import { scatterChart, type ScatterChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerScatterChartProps = ServerChartProps<ScatterChartProps>;

/** `ScatterChart` for React Server Components and static rendering (API Spec §8.1). */
export const ScatterChart = createServerChart<ScatterChartProps>(scatterChart);
