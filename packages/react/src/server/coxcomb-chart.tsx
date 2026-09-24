import { coxcombChart, type CoxcombChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerCoxcombChartProps = ServerChartProps<CoxcombChartProps>;

/** `CoxcombChart` for React Server Components and static rendering (API Spec §8.1). */
export const CoxcombChart = createServerChart<CoxcombChartProps>(coxcombChart);
