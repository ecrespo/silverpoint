import { vectorFieldChart } from '@silverpoint/core/catalog';
import type { VectorFieldChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { VectorFieldChartProps } from '@silverpoint/core';

export type ClientVectorFieldChartProps = VectorFieldChartProps & InteractionProps;

/** `VectorFieldChart` (REQ-425): an arrow per grid point (API Spec §7.3). */
export const VectorFieldChart = createClientChart<VectorFieldChartProps>(vectorFieldChart);
