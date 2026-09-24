import { radialArcGroup, type RadialArcGroupProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerRadialArcGroupProps = ServerChartProps<RadialArcGroupProps>;

/** `RadialArcGroup` for React Server Components and static rendering (API Spec §8.1). */
export const RadialArcGroup = createServerChart<RadialArcGroupProps>(radialArcGroup);
