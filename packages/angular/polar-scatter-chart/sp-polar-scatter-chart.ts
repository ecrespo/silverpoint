import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { polarScatterChart } from '@silverpoint/core/catalog';
import type { PolarScatterChartProps } from '@silverpoint/core';

type Prop<K extends keyof PolarScatterChartProps> = PolarScatterChartProps[K];

/**
 * `<sp-polar-scatter-chart>` (REQ-421): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-polar-scatter-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpPolarScatterChart extends SpChart<PolarScatterChartProps> {
  readonly angleKey = input<Prop<'angleKey'>>();
  readonly radiusKey = input<Prop<'radiusKey'>>();
  readonly sizeKey = input<Prop<'sizeKey'>>();
  readonly period = input<Prop<'period'>>();

  protected readonly ownProps = computed(() => ({
    angleKey: this.angleKey(),
    radiusKey: this.radiusKey(),
    sizeKey: this.sizeKey(),
    period: this.period(),
  }));

  constructor() {
    super(polarScatterChart);
  }
}
