import { marimekkoChart } from '@silverpoint/core/catalog';
import type { MarimekkoChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { MarimekkoChartProps } from '@silverpoint/core';

export type ClientMarimekkoChartProps = MarimekkoChartProps & InteractionProps;

/** `MarimekkoChart` (REQ-415): column width by total, segment height by share (API Spec §7.3). */
export const MarimekkoChart = createClientChart<MarimekkoChartProps>(marimekkoChart);
