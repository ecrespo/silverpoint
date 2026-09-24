import {
  instanceId,
  lineChart,
  reduceInteraction,
  type ActiveItem,
  type ChartHandle,
  type InteractionEvent,
  type LineChartProps,
  type PointerKind,
} from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import {
  forwardRef,
  useContext,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { ChartFrame } from './chart-frame';
import { SilverpointContext } from './context';
import { useForcedPrecision, useMeasuredWidth } from './environment';
import { Overlay, type TooltipRenderer } from './overlay';

export type { ChartHandle };

/** Interaction props of the client components (API Spec §9). */
export interface InteractionProps {
  /** The active item changed, or `null` when it cleared (REQ-141, REQ-143). */
  onActiveChange?: (item: ActiveItem | null) => void;
  /** An item was chosen by click, Enter or Space. */
  onSelect?: (item: ActiveItem) => void;
  /** Replaces the built-in readout (REQ-142). */
  tooltip?: TooltipRenderer;
}

export type ClientLineChartProps = LineChartProps & InteractionProps;

/** `LineChart` (REQ-060): spline with a dotted baseline series (API Spec §7). */
export const LineChart = forwardRef<ChartHandle, ClientLineChartProps>(function LineChart(allProps, ref) {
  const { onActiveChange, onSelect, tooltip } = allProps;
  const provider = useContext(SilverpointContext);
  const generated = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const forcedPrecision = useForcedPrecision();
  const measured = useMeasuredWidth(rootRef, allProps.width === undefined);

  const rendered = useMemo(
    () =>
      renderChart(lineChart, allProps, {
        id: instanceId(lineChart.name, generated),
        width: measured,
        provider,
        forcedPrecision,
      }),
    // Keyed on the props object React hands in, which is stable across this component's own
    // state changes, so moving the pointer never re-inks the chart.
    [allProps, generated, measured, provider, forcedPrecision],
  );

  const [active, setActive] = useState<ActiveItem | null>(null);
  const dispatch = (event: InteractionEvent): boolean => {
    const result = reduceInteraction(rendered.geometry, active, event);
    if (result.changed) {
      setActive(result.active);
      onActiveChange?.(result.active);
    }
    if (result.selected) onSelect?.(result.selected);
    return result.handled;
  };
  const pointer = (type: 'pointer' | 'click') => (event: PointerEvent<HTMLDivElement>) => {
    const svg = rootRef.current?.querySelector('svg.sp-chart');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    dispatch({
      type,
      client: { x: event.clientX, y: event.clientY },
      box: { left: box.left, top: box.top, width: box.width, height: box.height },
      kind: (event.pointerType || 'mouse') as PointerKind,
    });
  };
  const rootProps = {
    tabIndex: 0,
    role: 'group',
    'aria-label': rendered.name,
    onPointerMove: pointer('pointer'),
    onPointerDown: pointer('pointer'),
    onClick: pointer('click'),
    onPointerLeave: () => dispatch({ type: 'leave' }),
    onFocus: () => dispatch({ type: 'focus' }),
    onBlur: () => dispatch({ type: 'blur' }),
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (dispatch({ type: 'key', key: event.key })) event.preventDefault();
    },
  };

  useImperativeHandle(
    ref,
    () => ({
      getGeometry: () => rendered.geometry,
      toSVGString: () => toSVGString(rendered),
    }),
    [rendered],
  );

  return (
    <ChartFrame
      rendered={rendered}
      className={allProps.className}
      rootRef={rootRef}
      rootProps={rootProps}
      overlay={<Overlay rendered={rendered} active={active} tooltip={tooltip} />}
    />
  );
});
