import { radarChart, type RadarChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerRadarChartProps = ServerChartProps<RadarChartProps>;

/** `RadarChart` for React Server Components and static rendering (API Spec §8.1). */
export const RadarChart = createServerChart<RadarChartProps>(radarChart);
