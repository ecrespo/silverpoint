import { densityBinChart } from '@silverpoint/core/catalog';
import type { DensityBinChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { DensityBinChartProps } from '@silverpoint/core';

export type ClientDensityBinChartProps = DensityBinChartProps & InteractionProps;

/** `DensityBinChart` (REQ-422): x-y points counted in two-dimensional bins (API Spec §7.3). */
export const DensityBinChart = createClientChart<DensityBinChartProps>(densityBinChart);
