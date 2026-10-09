import { errorBarChart } from '@silverpoint/core/catalog';
import type { ErrorBarChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerErrorBarChartProps = ServerChartProps<ErrorBarChartProps>;

/** `ErrorBarChart` for React Server Components and static rendering (API Spec §8.1). */
export const ErrorBarChart = createServerChart<ErrorBarChartProps>(errorBarChart);
