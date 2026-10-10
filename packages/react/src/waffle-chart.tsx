import { waffleChart } from '@silverpoint/core/catalog';
import type { WaffleChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { WaffleChartProps } from '@silverpoint/core';

export type ClientWaffleChartProps = WaffleChartProps & InteractionProps;

/** `WaffleChart` (REQ-414): a unit grid filled in reading order by category (API Spec §7.3). */
export const WaffleChart = createClientChart<WaffleChartProps>(waffleChart);
