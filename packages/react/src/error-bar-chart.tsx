import { errorBarChart } from '@silverpoint/core/catalog';
import type { ErrorBarChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ErrorBarChartProps } from '@silverpoint/core';

export type ClientErrorBarChartProps = ErrorBarChartProps & InteractionProps;

/** `ErrorBarChart` (REQ-410): a point estimate with its interval per category (API Spec §7.3). */
export const ErrorBarChart = createClientChart<ErrorBarChartProps>(errorBarChart);
