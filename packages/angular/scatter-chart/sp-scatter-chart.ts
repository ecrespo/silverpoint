import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { scatterChart, type ScatterChartProps } from '@silverpoint/core';

type Prop<K extends keyof ScatterChartProps> = ScatterChartProps[K];

/**
 * `<sp-scatter-chart>` (REQ-082): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-scatter-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpScatterChart extends SpChart<ScatterChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly yKey = input<Prop<'yKey'>>();
  readonly sizeKey = input<Prop<'sizeKey'>>();
  readonly sizeRange = input<Prop<'sizeRange'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    yKey: this.yKey(),
    sizeKey: this.sizeKey(),
    sizeRange: this.sizeRange(),
  }));

  constructor() {
    super(scatterChart);
  }
}
