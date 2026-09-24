import { sparklineRows, type SparklineRowsProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerSparklineRowsProps = ServerChartProps<SparklineRowsProps>;

/** `SparklineRows` for React Server Components and static rendering (API Spec §8.1). */
export const SparklineRows = createServerChart<SparklineRowsProps>(sparklineRows);
