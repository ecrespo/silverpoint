import { activityGrid, type ActivityGridProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ActivityGridProps } from '@silverpoint/core';

export type ClientActivityGridProps = ActivityGridProps & InteractionProps;

/** `ActivityGrid` (REQ-087): one cell per day, a column per week (API Spec §7). */
export const ActivityGrid = createClientChart<ActivityGridProps>(activityGrid);
