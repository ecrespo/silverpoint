import { areaChart, type AreaChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { AreaChartProps } from '@silverpoint/core';

export type ClientAreaChartProps = AreaChartProps & InteractionProps;

/** `AreaChart` (REQ-072): a curved, toned area under its line (API Spec §7). */
export const AreaChart = createClientChart<AreaChartProps>(areaChart);
