import { ridgelineChart } from '@silverpoint/core/catalog';
import type { RidgelineChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerRidgelineChartProps = ServerChartProps<RidgelineChartProps>;

/** `RidgelineChart` for React Server Components and static rendering (API Spec §8.1). */
export const RidgelineChart = createServerChart<RidgelineChartProps>(ridgelineChart);
