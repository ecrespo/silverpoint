import { polarScatterChart } from '@silverpoint/core/catalog';
import type { PolarScatterChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { PolarScatterChartProps } from '@silverpoint/core';

export type ClientPolarScatterChartProps = PolarScatterChartProps & InteractionProps;

/** `PolarScatterChart` (REQ-421): points over angle and radius (API Spec §7.3). */
export const PolarScatterChart = createClientChart<PolarScatterChartProps>(polarScatterChart);
