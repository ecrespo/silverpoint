import { windRose, type WindRoseProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerWindRoseProps = ServerChartProps<WindRoseProps>;

/** `WindRose` for React Server Components and static rendering (API Spec §8.1). */
export const WindRose = createServerChart<WindRoseProps>(windRose);
