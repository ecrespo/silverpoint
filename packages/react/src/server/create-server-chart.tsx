import type { ChartRecipe, CommonChartProps } from '@silverpoint/core';
import { renderChart } from '@silverpoint/grounds';
import { ChartFrame } from '../chart-frame';

/**
 * Props of a server chart: pure SVG, no client JavaScript (REQ-104). Size is explicit because
 * nothing can be measured on the server; the id is explicit because a server component has no
 * mount position to derive a unique one from (TD §6); interaction props do not exist here.
 */
export type ServerChartProps<P extends CommonChartProps> = Omit<P, 'id' | 'width' | 'height'> & {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly onActiveChange?: never;
  readonly onSelect?: never;
};

/** The server component of a recipe, for React Server Components and static rendering. */
export function createServerChart<P extends CommonChartProps>(recipe: ChartRecipe<P>) {
  function Chart(props: ServerChartProps<P>) {
    const rendered = renderChart(recipe, props as unknown as P, { id: props.id });
    return <ChartFrame rendered={rendered} className={props.className} />;
  }
  Chart.displayName = recipe.name;
  return Chart;
}
