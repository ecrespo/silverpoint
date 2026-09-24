import { composedChart, type ComposedChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerComposedChartProps = ServerChartProps<ComposedChartProps>;

/** `ComposedChart` for React Server Components and static rendering (API Spec §8.1). */
export const ComposedChart = createServerChart<ComposedChartProps>(composedChart);
