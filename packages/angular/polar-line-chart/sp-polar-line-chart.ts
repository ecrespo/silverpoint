import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { polarLineChart } from '@silverpoint/core/catalog';
import type { PolarLineChartProps } from '@silverpoint/core';

type Prop<K extends keyof PolarLineChartProps> = PolarLineChartProps[K];

/**
 * `<sp-polar-line-chart>` (REQ-420): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-polar-line-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpPolarLineChart extends SpChart<PolarLineChartProps> {
  readonly angleKey = input<Prop<'angleKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly period = input<Prop<'period'>>();
  readonly startAngle = input<Prop<'startAngle'>>();

  protected readonly ownProps = computed(() => ({
    angleKey: this.angleKey(),
    valueKey: this.valueKey(),
    period: this.period(),
    startAngle: this.startAngle(),
  }));

  constructor() {
    super(polarLineChart);
  }
}
