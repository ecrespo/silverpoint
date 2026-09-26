import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, type TemplateRef } from '@angular/core';
import { linkedMarks, readout, type ActiveItem } from '@silverpoint/core';
import { SP_DASHBOARD_LINK } from './dashboard-cell';
import type { RenderedChart } from '@silverpoint/grounds';
import type { SpTooltipContext } from './tooltip';

/**
 * Marker, readout and live region of the active item (REQ-141, REQ-122). Every number comes from
 * the core's `readout`; this component only places it.
 */
@Component({
  selector: 'sp-chart-overlay',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (linked().length > 0) {
      <svg class="sp-marker" part="linked" [attr.viewBox]="rendered().view.svg.viewBox" aria-hidden="true" focusable="false">
        @for (d of linked(); track $index) {
          <path [attr.d]="d" />
        }
      </svg>
    }
    @let current = readoutOf();
    @let item = active();
    @if (current && item) {
      <svg class="sp-marker" [attr.viewBox]="rendered().view.svg.viewBox" aria-hidden="true" focusable="false">
        <path [attr.d]="current.marker.d" />
      </svg>
      <div class="sp-readout" [style.left]="current.left" [style.top]="current.top" aria-hidden="true">
        @if (tooltip(); as custom) {
          <ng-container *ngTemplateOutlet="custom; context: { $implicit: item, readout: current }" />
        } @else {
          <span class="sp-readout-heading">{{ current.heading }}</span>{{ current.text }}
        }
      </div>
    }
    <div class="sp-live" aria-live="polite">{{ current ? current.announcement : '' }}</div>
  `,
})
export class SpChartOverlay {
  readonly rendered = input.required<RenderedChart>();
  readonly active = input.required<ActiveItem | null>();
  readonly tooltip = input<TemplateRef<SpTooltipContext> | undefined>(undefined);

  private readonly link = inject(SP_DASHBOARD_LINK, { optional: true });
  /** Another chart's linked item, marked here and hidden from assistive technology (REQ-216, REQ-218). */
  protected readonly linked = computed(() => linkedMarks(this.rendered(), this.link?.linkState()));

  protected readonly readoutOf = computed(() => {
    const item = this.active();
    return item ? readout(this.rendered(), item) : null;
  });
}
