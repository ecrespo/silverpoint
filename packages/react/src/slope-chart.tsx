import { slopeChart } from '@silverpoint/core/catalog';
import type { SlopeChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { SlopeChartProps } from '@silverpoint/core';

export type ClientSlopeChartProps = SlopeChartProps & InteractionProps;

/** `SlopeChart` (REQ-408): two period axes, one segment per category (API Spec §7.3). */
export const SlopeChart = createClientChart<SlopeChartProps>(slopeChart);
