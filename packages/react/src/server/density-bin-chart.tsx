import { densityBinChart } from '@silverpoint/core/catalog';
import type { DensityBinChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerDensityBinChartProps = ServerChartProps<DensityBinChartProps>;

/** `DensityBinChart` for React Server Components and static rendering (API Spec §8.1). */
export const DensityBinChart = createServerChart<DensityBinChartProps>(densityBinChart);
