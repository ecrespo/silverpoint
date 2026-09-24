import { candlestickChart, type CandlestickChartProps } from '@silverpoint/core';
import { createServerChart, type ServerChartProps } from './create-server-chart';

export type ServerCandlestickChartProps = ServerChartProps<CandlestickChartProps>;

/** `CandlestickChart` for React Server Components and static rendering (API Spec §8.1). */
export const CandlestickChart = createServerChart<CandlestickChartProps>(candlestickChart);
