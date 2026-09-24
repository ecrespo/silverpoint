import { volvelleChart, type VolvelleChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerVolvelleChartProps = ServerChartProps<VolvelleChartProps>;

/** `VolvelleChart` for React Server Components and static rendering (API Spec §8.1). */
export const VolvelleChart = createServerChart<VolvelleChartProps>(volvelleChart);
