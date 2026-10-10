import { delaunayChart } from '@silverpoint/core/catalog';
import type { DelaunayChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { DelaunayChartProps } from '@silverpoint/core';

export type ClientDelaunayChartProps = DelaunayChartProps & InteractionProps;

/** `DelaunayChart` (REQ-424): the triangulation of x-y points, or its Voronoi cells (API Spec §7.3). */
export const DelaunayChart = createClientChart<DelaunayChartProps>(delaunayChart);
