import { squarifiedTreemap } from '@silverpoint/core/catalog';
import type { SquarifiedTreemapProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerSquarifiedTreemapProps = ServerChartProps<SquarifiedTreemapProps>;

/** `SquarifiedTreemap` for React Server Components and static rendering (API Spec §8.1). */
export const SquarifiedTreemap = createServerChart<SquarifiedTreemapProps>(squarifiedTreemap);
