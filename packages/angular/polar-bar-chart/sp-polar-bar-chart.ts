import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { polarBarChart, type PolarBarChartProps } from '@silverpoint/core';

type Prop<K extends keyof PolarBarChartProps> = PolarBarChartProps[K];

/**
 * `<sp-polar-bar-chart>` (REQ-077): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-polar-bar-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpPolarBarChart extends SpChart<PolarBarChartProps> {
  readonly nameKey = input<Prop<'nameKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();

  protected readonly ownProps = computed(() => ({
    nameKey: this.nameKey(),
    valueKey: this.valueKey(),
  }));

  constructor() {
    super(polarBarChart);
  }
}
