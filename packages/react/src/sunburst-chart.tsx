import { sunburstChart } from '@silverpoint/core/catalog';
import type { SunburstChartProps } from '@silverpoint/core';
import type { InteractionProps } from './create-chart';
import { createDrillableChart, type RootChangeProps } from './drillable';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { RootChangeProps } from './drillable';
export type { SunburstChartProps } from '@silverpoint/core';

export type ClientSunburstChartProps = SunburstChartProps & InteractionProps & RootChangeProps;

/** `SunburstChart` (REQ-417): a hierarchy as rings of arcs, drillable through `rootId` and `onRootChange` (API Spec §7.3). */
export const SunburstChart = createDrillableChart<SunburstChartProps>(sunburstChart);
