import { orbitChart, type OrbitChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerOrbitChartProps = ServerChartProps<OrbitChartProps>;

/** `OrbitChart` for React Server Components and static rendering (API Spec §8.1). */
export const OrbitChart = createServerChart<OrbitChartProps>(orbitChart);
