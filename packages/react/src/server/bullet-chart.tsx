import { bulletChart, type BulletChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerBulletChartProps = ServerChartProps<BulletChartProps>;

/** `BulletChart` for React Server Components and static rendering (API Spec §8.1). */
export const BulletChart = createServerChart<BulletChartProps>(bulletChart);
