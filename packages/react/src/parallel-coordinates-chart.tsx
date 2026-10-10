import { parallelCoordinatesChart } from '@silverpoint/core/catalog';
import type { ParallelCoordinatesChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ParallelCoordinatesChartProps } from '@silverpoint/core';

export type ClientParallelCoordinatesChartProps = ParallelCoordinatesChartProps & InteractionProps;

/** `ParallelCoordinatesChart` (REQ-419): one polyline per row across parallel axes (API Spec §7.3). */
export const ParallelCoordinatesChart = createClientChart<ParallelCoordinatesChartProps>(parallelCoordinatesChart);
