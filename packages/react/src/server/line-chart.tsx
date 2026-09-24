import { lineChart, type LineChartProps } from '@silverpoint/core';
import { renderChart } from '@silverpoint/grounds';
import { ChartFrame } from '../chart-frame';

/**
 * Props of the server `LineChart`: pure SVG, no client JavaScript (REQ-104). Size is explicit
 * because nothing can be measured on the server, and interaction props do not exist here.
 */
export type ServerLineChartProps = Omit<LineChartProps, 'width' | 'height'> & {
  readonly width: number;
  readonly height: number;
  readonly onActiveChange?: never;
  readonly onSelect?: never;
};

/** `LineChart` for React Server Components and static rendering (API Spec §8.1). */
export function LineChart(props: ServerLineChartProps) {
  const rendered = renderChart(lineChart, props, { id: props.id ?? 'sp-line-chart' });
  return <ChartFrame rendered={rendered} className={props.className} />;
}
