import { kpiCard, type KpiCardProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { KpiCardProps } from '@silverpoint/core';

export type ClientKpiCardProps = KpiCardProps & InteractionProps;

/** `KpiCard` (REQ-063): a figure, its signed delta and an area sparkline (API Spec §7). */
export const KpiCard = createClientChart<KpiCardProps>(kpiCard);
