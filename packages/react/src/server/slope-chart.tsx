import { slopeChart } from '@silverpoint/core/catalog';
import type { SlopeChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerSlopeChartProps = ServerChartProps<SlopeChartProps>;

/** `SlopeChart` for React Server Components and static rendering (API Spec §8.1). */
export const SlopeChart = createServerChart<SlopeChartProps>(slopeChart);
