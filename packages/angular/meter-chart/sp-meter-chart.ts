import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { meterChart, type MeterChartProps } from '@silverpoint/core';

type Prop<K extends keyof MeterChartProps> = MeterChartProps[K];

/**
 * `<sp-meter-chart>` (REQ-081): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-meter-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpMeterChart extends SpChart<MeterChartProps> {
  readonly percent = input<Prop<'percent'>>();
  readonly caption = input<Prop<'caption'>>();
  readonly readout = input<Prop<'readout'>>();

  protected readonly ownProps = computed(() => ({
    percent: this.percent(),
    caption: this.caption(),
    readout: this.readout(),
  }));

  constructor() {
    super(meterChart);
  }
}
