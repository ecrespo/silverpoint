import { dumbbellChart } from '@silverpoint/core/catalog';
import type { DumbbellChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { DumbbellChartProps } from '@silverpoint/core';

export type ClientDumbbellChartProps = DumbbellChartProps & InteractionProps;

/** `DumbbellChart` (REQ-407): two values per category joined by a segment (API Spec §7.3). */
export const DumbbellChart = createClientChart<DumbbellChartProps>(dumbbellChart);
