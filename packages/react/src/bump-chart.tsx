import { bumpChart } from '@silverpoint/core/catalog';
import type { BumpChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { BumpChartProps } from '@silverpoint/core';

export type ClientBumpChartProps = BumpChartProps & InteractionProps;

/** `BumpChart` (REQ-409): the rank of each series at each x (API Spec §7.3). */
export const BumpChart = createClientChart<BumpChartProps>(bumpChart);
