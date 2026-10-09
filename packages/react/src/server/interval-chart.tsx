import { intervalChart } from '@silverpoint/core/catalog';
import type { IntervalChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerIntervalChartProps = ServerChartProps<IntervalChartProps>;

/** `IntervalChart` for React Server Components and static rendering (API Spec §8.1). */
export const IntervalChart = createServerChart<IntervalChartProps>(intervalChart);
