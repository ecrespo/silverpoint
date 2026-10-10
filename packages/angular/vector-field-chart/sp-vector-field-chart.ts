import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { vectorFieldChart } from '@silverpoint/core/catalog';
import type { VectorFieldChartProps } from '@silverpoint/core';

type Prop<K extends keyof VectorFieldChartProps> = VectorFieldChartProps[K];

/**
 * `<sp-vector-field-chart>` (REQ-425): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-vector-field-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpVectorFieldChart extends SpChart<VectorFieldChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly yKey = input<Prop<'yKey'>>();
  readonly uKey = input<Prop<'uKey'>>();
  readonly vKey = input<Prop<'vKey'>>();
  readonly scale = input<Prop<'scale'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    yKey: this.yKey(),
    uKey: this.uKey(),
    vKey: this.vKey(),
    scale: this.scale(),
  }));

  constructor() {
    super(vectorFieldChart);
  }
}
