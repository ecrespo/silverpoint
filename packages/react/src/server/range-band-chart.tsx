import { rangeBandChart, type RangeBandChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerRangeBandChartProps = ServerChartProps<RangeBandChartProps>;

/** `RangeBandChart` for React Server Components and static rendering (API Spec §8.1). */
export const RangeBandChart = createServerChart<RangeBandChartProps>(rangeBandChart);
