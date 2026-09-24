import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { donutChart, type DonutChartProps } from '@silverpoint/core';

type Prop<K extends keyof DonutChartProps> = DonutChartProps[K];

/**
 * `<sp-donut-chart>` (REQ-075): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-donut-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpDonutChart extends SpChart<DonutChartProps> {
  readonly nameKey = input<Prop<'nameKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly centerValue = input<Prop<'centerValue'>>();
  readonly centerLabel = input<Prop<'centerLabel'>>();
  readonly legend = input<Prop<'legend'>>();

  protected readonly ownProps = computed(() => ({
    nameKey: this.nameKey(),
    valueKey: this.valueKey(),
    centerValue: this.centerValue(),
    centerLabel: this.centerLabel(),
    legend: this.legend(),
  }));

  constructor() {
    super(donutChart);
  }
}
