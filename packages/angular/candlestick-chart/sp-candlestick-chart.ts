import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { candlestickChart, type CandlestickChartProps } from '@silverpoint/core';

type Prop<K extends keyof CandlestickChartProps> = CandlestickChartProps[K];

/**
 * `<sp-candlestick-chart>` (REQ-071): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-candlestick-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpCandlestickChart extends SpChart<CandlestickChartProps> {
  readonly timeKey = input<Prop<'timeKey'>>();
  readonly openKey = input<Prop<'openKey'>>();
  readonly highKey = input<Prop<'highKey'>>();
  readonly lowKey = input<Prop<'lowKey'>>();
  readonly closeKey = input<Prop<'closeKey'>>();
  readonly bounds = input<Prop<'bounds'>>();

  protected readonly ownProps = computed(() => ({
    timeKey: this.timeKey(),
    openKey: this.openKey(),
    highKey: this.highKey(),
    lowKey: this.lowKey(),
    closeKey: this.closeKey(),
    bounds: this.bounds(),
  }));

  constructor() {
    super(candlestickChart);
  }
}
