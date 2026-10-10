import { contourChart } from '@silverpoint/core/catalog';
import type { ContourChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerContourChartProps = ServerChartProps<ContourChartProps>;

/** `ContourChart` for React Server Components and static rendering (API Spec §8.1). */
export const ContourChart = createServerChart<ContourChartProps>(contourChart);
