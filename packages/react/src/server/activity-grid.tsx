import { activityGrid, type ActivityGridProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerActivityGridProps = ServerChartProps<ActivityGridProps>;

/** `ActivityGrid` for React Server Components and static rendering (API Spec §8.1). */
export const ActivityGrid = createServerChart<ActivityGridProps>(activityGrid);
