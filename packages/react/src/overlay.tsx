import { readout, type ActiveItem, type Readout } from '@silverpoint/core';
import type { RenderedChart } from '@silverpoint/grounds';
import type { ReactNode } from 'react';

/** A consumer-supplied readout renderer (REQ-142). */
export type TooltipRenderer = (active: ActiveItem, readout: Readout) => ReactNode;

/**
 * Marker, readout and live region of the active item (REQ-141, REQ-122). Every number comes from
 * the core's `readout`; this component only places it.
 */
export function Overlay({
  rendered,
  active,
  tooltip,
}: {
  readonly rendered: RenderedChart;
  readonly active: ActiveItem | null;
  readonly tooltip?: TooltipRenderer;
}) {
  const current = active ? readout(rendered, active) : null;
  return (
    <>
      {current && active && (
        <>
          <svg className="sp-marker" viewBox={rendered.view.svg.viewBox} aria-hidden="true" focusable="false">
            <path d={current.marker.d} />
          </svg>
          <div className="sp-readout" style={{ left: current.left, top: current.top }} aria-hidden="true">
            {tooltip ? (
              tooltip(active, current)
            ) : (
              <>
                <span className="sp-readout-heading">{current.heading}</span>
                {current.text}
              </>
            )}
          </div>
        </>
      )}
      <div className="sp-live" aria-live="polite">
        {current ? current.announcement : ''}
      </div>
    </>
  );
}
