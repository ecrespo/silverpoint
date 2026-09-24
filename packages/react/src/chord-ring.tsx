import { chordRing, type ChordRingProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { ChordRingProps } from '@silverpoint/core';

export type ClientChordRingProps = ChordRingProps & InteractionProps;

/** `ChordRing` (REQ-091): flows between categories, ribbons over d3-chord (API Spec §7). */
export const ChordRing = createClientChart<ChordRingProps>(chordRing);
