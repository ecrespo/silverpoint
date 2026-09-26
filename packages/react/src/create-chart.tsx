import {
  inCell,
  instanceId,
  linkFrom,
  reduceInteraction,
  type ActiveItem,
  type ChartHandle,
  type ChartRecipe,
  type CommonChartProps,
  type InteractionEvent,
  type PointerKind,
} from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import {
  forwardRef,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type KeyboardEvent,
  type PointerEvent,
  type RefAttributes,
} from 'react';
import { ChartFrame } from './chart-frame';
import type { CellChartProps } from './dashboard-markup';
import { DashboardLinkContext } from './link-context';
import { SilverpointContext } from './context';
import { useForcedPrecision, useMeasuredWidth, useTypefaceCheck } from './environment';
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

export type ClientChart<P> = ForwardRefExoticComponent<P & InteractionProps & RefAttributes<ChartHandle>>;

/**
 * The client component of a recipe: it measures, renders through the core pipeline and forwards
 * interaction events to the core's reducer. Every client chart is this function applied to its
 * recipe, so the charts differ only in the recipe (Art. 2).
 */
export function createClientChart<P extends CommonChartProps>(recipe: ChartRecipe<P>): ClientChart<P> {
  const Chart = forwardRef<ChartHandle, P & InteractionProps & CellChartProps>(function Chart(allProps, ref) {
    const { onActiveChange, onSelect, tooltip } = allProps;
    const provider = useContext(SilverpointContext);
    const link = useContext(DashboardLinkContext);
    const generated = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const forcedPrecision = useForcedPrecision();
    useTypefaceCheck(recipe.name);
    const measured = useMeasuredWidth(rootRef, allProps.width === undefined);

    const rendered = useMemo(() => {
      // Inside a dashboard cell: its id, height and config, and its nominal width until measured
      // (REQ-206, REQ-207, REQ-209, REQ-212); the chart's own props win.
      const { dashboardCell, ...own } = allProps;
      const fitted = inCell(own as unknown as P, dashboardCell, recipe);
      return renderChart(recipe, fitted.props, {
        id: instanceId(recipe.name, generated),
        width: measured ?? fitted.width,
        provider,
        forcedPrecision,
      });
      // Keyed on the props object React hands in, which is stable across this component's own
      // state changes, so moving the pointer never re-inks the chart.
    }, [allProps, generated, measured, provider, forcedPrecision]);

    const [active, setActive] = useState<ActiveItem | null>(null);
    const dispatch = (event: InteractionEvent): boolean => {
      const result = reduceInteraction(rendered.geometry, active, event);
      if (result.changed) {
        setActive(result.active);
        onActiveChange?.(result.active);
        // In a linked dashboard this chart becomes the source, or clears the link (REQ-216, REQ-218).
        link?.set(linkFrom(link.key, rendered.id, result.active));
      }
      if (result.selected) onSelect?.(result.selected);
      return result.handled;
    };
    // WCAG 1.4.13: a readout shown by the pointer is dismissible with Escape wherever focus is.
    const latest = useRef(dispatch);
    latest.current = dispatch;
    const showing = active !== null;
    useEffect(() => {
      if (!showing) return undefined;
      const onKey = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Escape' && !rootRef.current?.contains(event.target as Node)) latest.current({ type: 'key', key: 'Escape' });
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [showing]);
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
  Chart.displayName = recipe.name;
  return Chart as ClientChart<P>;
}
