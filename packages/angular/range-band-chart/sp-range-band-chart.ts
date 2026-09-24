import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { rangeBandChart, type RangeBandChartProps } from '@silverpoint/core';

type Prop<K extends keyof RangeBandChartProps> = RangeBandChartProps[K];

/**
 * `<sp-range-band-chart>` (REQ-073): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-range-band-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpRangeBandChart extends SpChart<RangeBandChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly lowKey = input<Prop<'lowKey'>>();
  readonly highKey = input<Prop<'highKey'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    lowKey: this.lowKey(),
    highKey: this.highKey(),
  }));

  constructor() {
    super(rangeBandChart);
  }
}
