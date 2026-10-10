import { vectorFieldChart } from '@silverpoint/core/catalog';
import type { VectorFieldChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerVectorFieldChartProps = ServerChartProps<VectorFieldChartProps>;

/** `VectorFieldChart` for React Server Components and static rendering (API Spec §8.1). */
export const VectorFieldChart = createServerChart<VectorFieldChartProps>(vectorFieldChart);
