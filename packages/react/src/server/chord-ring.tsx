import { chordRing, type ChordRingProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerChordRingProps = ServerChartProps<ChordRingProps>;

/** `ChordRing` for React Server Components and static rendering (API Spec §8.1). */
export const ChordRing = createServerChart<ChordRingProps>(chordRing);
