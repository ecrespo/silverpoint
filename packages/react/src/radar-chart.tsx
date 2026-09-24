import { radarChart, type RadarChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { RadarChartProps } from '@silverpoint/core';

export type ClientRadarChartProps = RadarChartProps & InteractionProps;

/** `RadarChart` (REQ-076): one spoke per subject, a closed polygon of values (API Spec §7). */
export const RadarChart = createClientChart<RadarChartProps>(radarChart);
