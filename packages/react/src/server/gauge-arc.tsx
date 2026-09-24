import { gaugeArc, type GaugeArcProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerGaugeArcProps = ServerChartProps<GaugeArcProps>;

/** `GaugeArc` for React Server Components and static rendering (API Spec §8.1). */
export const GaugeArc = createServerChart<GaugeArcProps>(gaugeArc);
