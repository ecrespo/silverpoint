import { donutChart, type DonutChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { DonutChartProps } from '@silverpoint/core';

export type ClientDonutChartProps = DonutChartProps & InteractionProps;

/** `DonutChart` (REQ-075): sectors ∝ value around a central readout (API Spec §7). */
export const DonutChart = createClientChart<DonutChartProps>(donutChart);
