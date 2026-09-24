import { bulletChart, type BulletChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { BulletChartProps } from '@silverpoint/core';

export type ClientBulletChartProps = BulletChartProps & InteractionProps;

/** `BulletChart` (REQ-069): a bar to the actual value and a marker at the target (API Spec §7). */
export const BulletChart = createClientChart<BulletChartProps>(bulletChart);
