import { gaugeArc, type GaugeArcProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { GaugeArcProps } from '@silverpoint/core';

export type ClientGaugeArcProps = GaugeArcProps & InteractionProps;

/** `GaugeArc` (REQ-080): a 240° arc swept to a percent (API Spec §7). */
export const GaugeArc = createClientChart<GaugeArcProps>(gaugeArc);
