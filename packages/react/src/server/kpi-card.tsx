import { kpiCard, type KpiCardProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerKpiCardProps = ServerChartProps<KpiCardProps>;

/** `KpiCard` for React Server Components and static rendering (API Spec §8.1). */
export const KpiCard = createServerChart<KpiCardProps>(kpiCard);
