import { parallelCoordinatesChart } from '@silverpoint/core/catalog';
import type { ParallelCoordinatesChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerParallelCoordinatesChartProps = ServerChartProps<ParallelCoordinatesChartProps>;

/** `ParallelCoordinatesChart` for React Server Components and static rendering (API Spec §8.1). */
export const ParallelCoordinatesChart = createServerChart<ParallelCoordinatesChartProps>(parallelCoordinatesChart);
