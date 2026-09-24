import { radialRings, type RadialRingsProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { RadialRingsProps } from '@silverpoint/core';

export type ClientRadialRingsProps = RadialRingsProps & InteractionProps;

/** `RadialRings` (REQ-079): concentric progress rings (API Spec §7). */
export const RadialRings = createClientChart<RadialRingsProps>(radialRings);
