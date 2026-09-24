import { sparklineRows, type SparklineRowsProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { SparklineRowsProps } from '@silverpoint/core';

export type ClientSparklineRowsProps = SparklineRowsProps & InteractionProps;

/** `SparklineRows` (REQ-062): one row per series: name, sparkline, readout (API Spec §7). */
export const SparklineRows = createClientChart<SparklineRowsProps>(sparklineRows);
