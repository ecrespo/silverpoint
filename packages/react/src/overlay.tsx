import { linkedMarks, readout, type ActiveItem, type Readout } from '@silverpoint/core';
import type { RenderedChart } from '@silverpoint/grounds';
import { useContext, type ReactNode } from 'react';
import { DashboardLinkContext } from './link-context';

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
  // Another chart's linked item, marked here and hidden from assistive technology (REQ-216, REQ-218).
  const linked = linkedMarks(rendered, useContext(DashboardLinkContext)?.state);
  return (
    <>
      {linked.length > 0 && (
        <svg className="sp-marker" part="linked" viewBox={rendered.view.svg.viewBox} aria-hidden="true" focusable="false">
          {linked.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </svg>
      )}
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
