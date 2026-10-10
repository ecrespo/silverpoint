import { squarifiedTreemap } from '@silverpoint/core/catalog';
import type { SquarifiedTreemapProps } from '@silverpoint/core';
import type { InteractionProps } from './create-chart';
import { createDrillableChart, type RootChangeProps } from './drillable';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { RootChangeProps } from './drillable';
export type { SquarifiedTreemapProps } from '@silverpoint/core';

export type ClientSquarifiedTreemapProps = SquarifiedTreemapProps & InteractionProps & RootChangeProps;

/** `SquarifiedTreemap` (REQ-416): nested rectangles, area by value, drillable through `rootId` and `onRootChange` (API Spec §7.3). */
export const SquarifiedTreemap = createDrillableChart<SquarifiedTreemapProps>(squarifiedTreemap);
