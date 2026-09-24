import { meterChart, type MeterChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { MeterChartProps } from '@silverpoint/core';

export type ClientMeterChartProps = MeterChartProps & InteractionProps;

/** `MeterChart` (REQ-081): a semicircular meter with a needle (API Spec §7). */
export const MeterChart = createClientChart<MeterChartProps>(meterChart);
