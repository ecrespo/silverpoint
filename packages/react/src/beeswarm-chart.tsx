import { beeswarmChart } from '@silverpoint/core/catalog';
import type { BeeswarmChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { BeeswarmChartProps } from '@silverpoint/core';

export type ClientBeeswarmChartProps = BeeswarmChartProps & InteractionProps;

/** `BeeswarmChart` (REQ-405): one point per observation, packed without overlap (API Spec §7.3). */
export const BeeswarmChart = createClientChart<BeeswarmChartProps>(beeswarmChart);
