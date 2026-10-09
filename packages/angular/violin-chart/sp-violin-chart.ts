import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { violinChart } from '@silverpoint/core/catalog';
import type { ViolinChartProps } from '@silverpoint/core';

type Prop<K extends keyof ViolinChartProps> = ViolinChartProps[K];

/**
 * `<sp-violin-chart>` (REQ-403): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-violin-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpViolinChart extends SpChart<ViolinChartProps> {
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly groupKey = input<Prop<'groupKey'>>();
  readonly bandwidth = input<Prop<'bandwidth'>>();
  readonly quartiles = input<Prop<'quartiles'>>();
  readonly orientation = input<Prop<'orientation'>>();

  protected readonly ownProps = computed(() => ({
    valueKey: this.valueKey(),
    groupKey: this.groupKey(),
    bandwidth: this.bandwidth(),
    quartiles: this.quartiles(),
    orientation: this.orientation(),
  }));

  constructor() {
    super(violinChart);
  }
}
