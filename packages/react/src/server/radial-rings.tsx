import { radialRings, type RadialRingsProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerRadialRingsProps = ServerChartProps<RadialRingsProps>;

/** `RadialRings` for React Server Components and static rendering (API Spec §8.1). */
export const RadialRings = createServerChart<RadialRingsProps>(radialRings);
