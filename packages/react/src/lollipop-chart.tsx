import { lollipopChart } from '@silverpoint/core/catalog';
import type { LollipopChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { LollipopChartProps } from '@silverpoint/core';

export type ClientLollipopChartProps = LollipopChartProps & InteractionProps;

/** `LollipopChart` (REQ-406): a stem from the baseline and a head at the value (API Spec §7.3). */
export const LollipopChart = createClientChart<LollipopChartProps>(lollipopChart);
