import { connectedScatterChart } from '@silverpoint/core/catalog';
import type { ConnectedScatterChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ConnectedScatterChartProps } from '@silverpoint/core';

export type ClientConnectedScatterChartProps = ConnectedScatterChartProps & InteractionProps;

/** `ConnectedScatterChart` (REQ-413): an ordered path through x-y points (API Spec §7.3). */
export const ConnectedScatterChart = createClientChart<ConnectedScatterChartProps>(connectedScatterChart);
