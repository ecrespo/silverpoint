import { polarScatterChart } from '@silverpoint/core/catalog';
import type { PolarScatterChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerPolarScatterChartProps = ServerChartProps<PolarScatterChartProps>;

/** `PolarScatterChart` for React Server Components and static rendering (API Spec §8.1). */
export const PolarScatterChart = createServerChart<PolarScatterChartProps>(polarScatterChart);
