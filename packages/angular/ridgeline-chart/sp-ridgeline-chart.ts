import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { ridgelineChart } from '@silverpoint/core/catalog';
import type { RidgelineChartProps } from '@silverpoint/core';

type Prop<K extends keyof RidgelineChartProps> = RidgelineChartProps[K];

/**
 * `<sp-ridgeline-chart>` (REQ-404): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-ridgeline-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpRidgelineChart extends SpChart<RidgelineChartProps> {
  readonly valueKey = input<Prop<'valueKey'>>();
  /** Required, as in every adapter; ignored with the demo (REQ-099). */
  readonly groupKey = input.required<Prop<'groupKey'>>();
  readonly bandwidth = input<Prop<'bandwidth'>>();
  readonly overlap = input<Prop<'overlap'>>();

  protected readonly ownProps = computed(() => ({
    valueKey: this.valueKey(),
    groupKey: this.groupKey(),
    bandwidth: this.bandwidth(),
    overlap: this.overlap(),
  }));

  constructor() {
    super(ridgelineChart);
  }
}
