import { diagnose, inCell, instanceId, type ChartRecipe, type CommonChartProps } from '@silverpoint/core';
import { renderChart } from '@silverpoint/grounds';
import { ChartFrame } from '../chart-frame';
import type { CellChartProps } from '../dashboard-markup';

/**
 * Props of a server chart: pure SVG, no client JavaScript (REQ-104); interaction props do not
 * exist here. Nothing can be measured on the server and a server component has no mount position
 * to derive a unique id from (TD §6), so a chart standing alone passes `id`, `width` and `height`;
 * inside a `Dashboard` the cell supplies them (REQ-206, REQ-209).
 */
export type ServerChartProps<P extends CommonChartProps> = Omit<P, 'id' | 'width' | 'height'> & {
  readonly id?: string;
  readonly width?: number;
  readonly height?: number;
  readonly onActiveChange?: never;
  readonly onSelect?: never;
};

/** The server component of a recipe, for React Server Components and static rendering. */
export function createServerChart<P extends CommonChartProps>(recipe: ChartRecipe<P>) {
  function Chart({ dashboardCell, ...own }: ServerChartProps<P> & CellChartProps) {
    const { props, width } = inCell(own as unknown as P, dashboardCell, recipe);
    if (process.env.NODE_ENV !== 'production') {
      if (props.id === undefined) diagnose('SP002', recipe.name, { property: 'id', message: 'A server chart outside a Dashboard needs an `id`; a fixed one is used, which two such charts on a page would share.' });
      if (width === undefined) diagnose('SP003', recipe.name, { property: 'width', message: 'A server chart cannot be measured: pass `width`, or place it in a Dashboard.' });
    }
    const rendered = renderChart(recipe, props, { id: props.id ?? instanceId(recipe.name, 'server'), width });
    return <ChartFrame rendered={rendered} className={props.className} />;
  }
  Chart.displayName = recipe.name;
  return Chart;
}
