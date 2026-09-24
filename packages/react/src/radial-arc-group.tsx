import { radialArcGroup, type RadialArcGroupProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { RadialArcGroupProps } from '@silverpoint/core';

export type ClientRadialArcGroupProps = RadialArcGroupProps & InteractionProps;

/** `RadialArcGroup` (REQ-078): concentric 180° tracks (API Spec §7). */
export const RadialArcGroup = createClientChart<RadialArcGroupProps>(radialArcGroup);
