import { funnelChart, type FunnelChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { FunnelChartProps } from '@silverpoint/core';

export type ClientFunnelChartProps = FunnelChartProps & InteractionProps;

/** `FunnelChart` (REQ-068): centred stages, width by value (API Spec §7). */
export const FunnelChart = createClientChart<FunnelChartProps>(funnelChart);
