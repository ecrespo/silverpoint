import { instanceId, lineChart, type ChartHandle, type LineChartProps } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { forwardRef, useContext, useId, useImperativeHandle, useMemo, useRef } from 'react';
import { ChartFrame } from './chart-frame';
import { SilverpointContext } from './context';
import { useForcedPrecision, useMeasuredWidth } from './environment';

export type { ChartHandle };

/** `LineChart` (REQ-060): spline with a dotted baseline series (API Spec §7). */
export const LineChart = forwardRef<ChartHandle, LineChartProps>(function LineChart(props, ref) {
  const provider = useContext(SilverpointContext);
  const generated = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const forcedPrecision = useForcedPrecision();
  const measured = useMeasuredWidth(rootRef, props.width === undefined);

  const rendered = useMemo(
    () =>
      renderChart(lineChart, props, {
        id: instanceId(lineChart.name, generated),
        width: measured,
        provider,
        forcedPrecision,
      }),
    [props, generated, measured, provider, forcedPrecision],
  );

  useImperativeHandle(
    ref,
    () => ({
      getGeometry: () => rendered.geometry,
      toSVGString: () => toSVGString(rendered),
    }),
    [rendered],
  );

  return <ChartFrame rendered={rendered} className={props.className} rootRef={rootRef} />;
});
