import { marimekkoChart } from '@silverpoint/core/catalog';
import type { MarimekkoChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerMarimekkoChartProps = ServerChartProps<MarimekkoChartProps>;

/** `MarimekkoChart` for React Server Components and static rendering (API Spec §8.1). */
export const MarimekkoChart = createServerChart<MarimekkoChartProps>(marimekkoChart);
