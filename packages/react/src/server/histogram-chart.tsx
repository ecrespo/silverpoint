import { histogramChart } from '@silverpoint/core/catalog';
import type { HistogramChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerHistogramChartProps = ServerChartProps<HistogramChartProps>;

/** `HistogramChart` for React Server Components and static rendering (API Spec §8.1). */
export const HistogramChart = createServerChart<HistogramChartProps>(histogramChart);
