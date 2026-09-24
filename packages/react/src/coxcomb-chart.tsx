import { coxcombChart, type CoxcombChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { CoxcombChartProps } from '@silverpoint/core';

export type ClientCoxcombChartProps = CoxcombChartProps & InteractionProps;

/** `CoxcombChart` (REQ-088): equal angles, area ∝ value (API Spec §7). */
export const CoxcombChart = createClientChart<CoxcombChartProps>(coxcombChart);
