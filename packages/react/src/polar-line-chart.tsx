import { polarLineChart } from '@silverpoint/core/catalog';
import type { PolarLineChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { PolarLineChartProps } from '@silverpoint/core';

export type ClientPolarLineChartProps = PolarLineChartProps & InteractionProps;

/** `PolarLineChart` (REQ-420): a line over angle and radius (API Spec §7.3). */
export const PolarLineChart = createClientChart<PolarLineChartProps>(polarLineChart);
