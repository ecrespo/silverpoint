import { ecdfChart } from '@silverpoint/core/catalog';
import type { EcdfChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { EcdfChartProps } from '@silverpoint/core';

export type ClientEcdfChartProps = EcdfChartProps & InteractionProps;

/** `EcdfChart` (REQ-401): the empirical cumulative distribution as a step function (API Spec §7.3). */
export const EcdfChart = createClientChart<EcdfChartProps>(ecdfChart);
