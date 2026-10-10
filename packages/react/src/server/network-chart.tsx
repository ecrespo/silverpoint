import { networkChart } from '@silverpoint/core/catalog';
import type { NetworkChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerNetworkChartProps = ServerChartProps<NetworkChartProps>;

/** `NetworkChart` for React Server Components and static rendering (API Spec §8.1). */
export const NetworkChart = createServerChart<NetworkChartProps>(networkChart);
