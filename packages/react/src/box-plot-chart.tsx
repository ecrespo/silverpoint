import { boxPlotChart } from '@silverpoint/core/catalog';
import type { BoxPlotChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { BoxPlotChartProps } from '@silverpoint/core';

export type ClientBoxPlotChartProps = BoxPlotChartProps & InteractionProps;

/** `BoxPlotChart` (REQ-402): quartiles, median, Tukey whiskers and outliers per group (API Spec §7.3). */
export const BoxPlotChart = createClientChart<BoxPlotChartProps>(boxPlotChart);
