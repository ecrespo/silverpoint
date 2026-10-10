import { contourChart } from '@silverpoint/core/catalog';
import type { ContourChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ContourChartProps } from '@silverpoint/core';

export type ClientContourChartProps = ContourChartProps & InteractionProps;

/** `ContourChart` (REQ-423): iso-lines and filled bands of a density or a grid (API Spec §7.3). */
export const ContourChart = createClientChart<ContourChartProps>(contourChart);
