import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { barChart, type BarChartProps } from '@silverpoint/core';

type Prop<K extends keyof BarChartProps> = BarChartProps[K];

/**
 * `<sp-bar-chart>` (REQ-064): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-bar-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpBarChart extends SpChart<BarChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly secondaryKey = input<Prop<'secondaryKey'>>();
  readonly orientation = input<Prop<'orientation'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    valueKey: this.valueKey(),
    secondaryKey: this.secondaryKey(),
    orientation: this.orientation(),
  }));

  constructor() {
    super(barChart);
  }
}
