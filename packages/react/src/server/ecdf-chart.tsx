import { ecdfChart } from '@silverpoint/core/catalog';
import type { EcdfChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerEcdfChartProps = ServerChartProps<EcdfChartProps>;

/** `EcdfChart` for React Server Components and static rendering (API Spec §8.1). */
export const EcdfChart = createServerChart<EcdfChartProps>(ecdfChart);
