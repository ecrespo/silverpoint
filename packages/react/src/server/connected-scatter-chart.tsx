import { connectedScatterChart } from '@silverpoint/core/catalog';
import type { ConnectedScatterChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerConnectedScatterChartProps = ServerChartProps<ConnectedScatterChartProps>;

/** `ConnectedScatterChart` for React Server Components and static rendering (API Spec §8.1). */
export const ConnectedScatterChart = createServerChart<ConnectedScatterChartProps>(connectedScatterChart);
