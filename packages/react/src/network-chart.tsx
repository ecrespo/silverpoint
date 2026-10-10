import { networkChart } from '@silverpoint/core/catalog';
import type { NetworkChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { NetworkChartProps } from '@silverpoint/core';

export type ClientNetworkChartProps = NetworkChartProps & InteractionProps;

/** `NetworkChart` (REQ-426): a node-link graph (API Spec §7.3). */
export const NetworkChart = createClientChart<NetworkChartProps>(networkChart);
