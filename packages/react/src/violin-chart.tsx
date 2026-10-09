import { violinChart } from '@silverpoint/core/catalog';
import type { ViolinChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ViolinChartProps } from '@silverpoint/core';

export type ClientViolinChartProps = ViolinChartProps & InteractionProps;

/** `ViolinChart` (REQ-403): a mirrored kernel density per group (API Spec §7.3). */
export const ViolinChart = createClientChart<ViolinChartProps>(violinChart);
