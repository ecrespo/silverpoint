import { boxPlotChart } from '@silverpoint/core/catalog';
import type { BoxPlotChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerBoxPlotChartProps = ServerChartProps<BoxPlotChartProps>;

/** `BoxPlotChart` for React Server Components and static rendering (API Spec §8.1). */
export const BoxPlotChart = createServerChart<BoxPlotChartProps>(boxPlotChart);
