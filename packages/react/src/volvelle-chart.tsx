import { volvelleChart, type VolvelleChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { VolvelleChartProps } from '@silverpoint/core';

export type ClientVolvelleChartProps = VolvelleChartProps & InteractionProps;

/** `VolvelleChart` (REQ-090): concentric rings read against one index (API Spec §7). */
export const VolvelleChart = createClientChart<VolvelleChartProps>(volvelleChart);
