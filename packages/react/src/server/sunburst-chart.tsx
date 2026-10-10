import { sunburstChart } from '@silverpoint/core/catalog';
import type { SunburstChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerSunburstChartProps = ServerChartProps<SunburstChartProps>;

/** `SunburstChart` for React Server Components and static rendering (API Spec §8.1). */
export const SunburstChart = createServerChart<SunburstChartProps>(sunburstChart);
