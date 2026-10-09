import { ridgelineChart } from '@silverpoint/core/catalog';
import type { RidgelineChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { RidgelineChartProps } from '@silverpoint/core';

export type ClientRidgelineChartProps = RidgelineChartProps & InteractionProps;

/** `RidgelineChart` (REQ-404): a kernel density per group on overlapping baselines (API Spec §7.3). */
export const RidgelineChart = createClientChart<RidgelineChartProps>(ridgelineChart);
