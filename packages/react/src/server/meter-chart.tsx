import { meterChart, type MeterChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerMeterChartProps = ServerChartProps<MeterChartProps>;

/** `MeterChart` for React Server Components and static rendering (API Spec §8.1). */
export const MeterChart = createServerChart<MeterChartProps>(meterChart);
