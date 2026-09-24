import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { areaChart, type AreaChartProps } from '@silverpoint/core';

type Prop<K extends keyof AreaChartProps> = AreaChartProps[K];

/**
 * `<sp-area-chart>` (REQ-072): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-area-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpAreaChart extends SpChart<AreaChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly curve = input<Prop<'curve'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    valueKey: this.valueKey(),
    curve: this.curve(),
  }));

  constructor() {
    super(areaChart);
  }
}
