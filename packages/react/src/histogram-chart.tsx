import { histogramChart } from '@silverpoint/core/catalog';
import type { HistogramChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { HistogramChartProps } from '@silverpoint/core';

export type ClientHistogramChartProps = HistogramChartProps & InteractionProps;

/** `HistogramChart` (REQ-400): raw observations binned in the core (API Spec §7.3). */
export const HistogramChart = createClientChart<HistogramChartProps>(histogramChart);
