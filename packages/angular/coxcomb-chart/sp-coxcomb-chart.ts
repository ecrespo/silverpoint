import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { coxcombChart, type CoxcombChartProps } from '@silverpoint/core';

type Prop<K extends keyof CoxcombChartProps> = CoxcombChartProps[K];

/**
 * `<sp-coxcomb-chart>` (REQ-088): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-coxcomb-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpCoxcombChart extends SpChart<CoxcombChartProps> {
  readonly nameKey = input<Prop<'nameKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly startAngle = input<Prop<'startAngle'>>();

  protected readonly ownProps = computed(() => ({
    nameKey: this.nameKey(),
    valueKey: this.valueKey(),
    startAngle: this.startAngle(),
  }));

  constructor() {
    super(coxcombChart);
  }
}
