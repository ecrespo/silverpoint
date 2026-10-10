import { rootChangeOf } from '@silverpoint/core/catalog';
import type { ActiveItem, ChartHandle, ChartRecipe, CommonChartProps } from '@silverpoint/core';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { createClientChart, type ClientChart, type InteractionProps } from './create-chart';

/** The event of the two drillable charts (API delta §4). */
export interface RootChangeProps {
  /** A node was activated: the id to draw as root, `null` for the data root (REQ-439). */
  onRootChange?: (id: string | null) => void;
}

/**
 * The client component of a drillable recipe: the client chart, whose `onSelect` also emits
 * `onRootChange`, read from the drawing as it is now. The root stays the consumer's `rootId`; this
 * component holds none (REQ-108).
 */
export function createDrillableChart<P extends CommonChartProps>(recipe: ChartRecipe<P>): ClientChart<P & RootChangeProps> {
  const Chart = createClientChart(recipe) as unknown as ClientChart<CommonChartProps>;
  const Drillable = forwardRef<ChartHandle, P & InteractionProps & RootChangeProps>(function Drillable({ onRootChange, onSelect, ...props }, ref) {
    const chart = useRef<ChartHandle>(null);
    // The inner handle changes with every drawing, so the outer one reads it at call time.
    useImperativeHandle(ref, () => ({ getGeometry: () => (chart.current as ChartHandle).getGeometry(), toSVGString: () => (chart.current as ChartHandle).toSVGString() }), []);
    const select = (item: ActiveItem) => {
      onSelect?.(item);
      if (onRootChange && chart.current) onRootChange(rootChangeOf(chart.current.getGeometry(), item));
    };
    return <Chart {...(props as CommonChartProps)} onSelect={select} ref={chart} />;
  });
  Drillable.displayName = recipe.name;
  return Drillable as unknown as ClientChart<P & RootChangeProps>;
}
