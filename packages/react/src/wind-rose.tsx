import { windRose, type WindRoseProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { WindRoseProps } from '@silverpoint/core';

export type ClientWindRoseProps = WindRoseProps & InteractionProps;

/** `WindRose` (REQ-089): observations by compass sector and speed (API Spec §7). */
export const WindRose = createClientChart<WindRoseProps>(windRose);
