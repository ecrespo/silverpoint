import { lineChart, type LineChartProps } from '@silverpoint/core';
import { renderChart, toSVGString, type RenderEnvironment } from '@silverpoint/grounds';

/** The canonical render of the line chart, computed by the core pipeline itself. */
export function canonical(props: LineChartProps, environment: Partial<RenderEnvironment> = {}): string {
  return toSVGString(renderChart(lineChart, props, { id: 'unused', ...environment }));
}
