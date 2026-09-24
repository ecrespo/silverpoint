import { orbitChart, type OrbitChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { OrbitChartProps } from '@silverpoint/core';

export type ClientOrbitChartProps = OrbitChartProps & InteractionProps;

/** `OrbitChart` (REQ-092): nested orbits with markers along them (API Spec §7). */
export const OrbitChart = createClientChart<OrbitChartProps>(orbitChart);
