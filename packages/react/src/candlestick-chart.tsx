import { candlestickChart, type CandlestickChartProps } from '@silverpoint/core';
import { createClientChart, type InteractionProps } from './create-chart';

export type { ChartHandle, InteractionProps } from './create-chart';
export type { CandlestickChartProps } from '@silverpoint/core';

export type ClientCandlestickChartProps = CandlestickChartProps & InteractionProps;

/** `CandlestickChart` (REQ-071): OHLC bodies and wicks (API Spec §7). */
export const CandlestickChart = createClientChart<CandlestickChartProps>(candlestickChart);
