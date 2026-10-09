import { lollipopChart } from '@silverpoint/core/catalog';
import type { LollipopChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerLollipopChartProps = ServerChartProps<LollipopChartProps>;

/** `LollipopChart` for React Server Components and static rendering (API Spec §8.1). */
export const LollipopChart = createServerChart<LollipopChartProps>(lollipopChart);
