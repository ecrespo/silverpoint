import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { lineChart, type LineChartProps } from '@silverpoint/core';

type Prop<K extends keyof LineChartProps> = LineChartProps[K];

/**
 * `<sp-line-chart>` (REQ-060): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-line-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpLineChart extends SpChart<LineChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly secondaryKey = input<Prop<'secondaryKey'>>();
  readonly curve = input<Prop<'curve'>>();
  readonly series = input<Prop<'series'>>();
  readonly connectNulls = input<Prop<'connectNulls'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    valueKey: this.valueKey(),
    secondaryKey: this.secondaryKey(),
    curve: this.curve(),
    series: this.series(),
    connectNulls: this.connectNulls(),
  }));

  constructor() {
    super(lineChart);
  }
}
