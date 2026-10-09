import { bumpChart } from '@silverpoint/core/catalog';
import type { BumpChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerBumpChartProps = ServerChartProps<BumpChartProps>;

/** `BumpChart` for React Server Components and static rendering (API Spec §8.1). */
export const BumpChart = createServerChart<BumpChartProps>(bumpChart);
