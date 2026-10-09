import { dumbbellChart } from '@silverpoint/core/catalog';
import type { DumbbellChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerDumbbellChartProps = ServerChartProps<DumbbellChartProps>;

/** `DumbbellChart` for React Server Components and static rendering (API Spec §8.1). */
export const DumbbellChart = createServerChart<DumbbellChartProps>(dumbbellChart);
