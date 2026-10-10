import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { densityBinChart } from '@silverpoint/core/catalog';
import type { DensityBinChartProps } from '@silverpoint/core';

type Prop<K extends keyof DensityBinChartProps> = DensityBinChartProps[K];

/**
 * `<sp-density-bin-chart>` (REQ-422): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-density-bin-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpDensityBinChart extends SpChart<DensityBinChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly yKey = input<Prop<'yKey'>>();
  readonly binShape = input<Prop<'binShape'>>();
  readonly binSize = input<Prop<'binSize'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    yKey: this.yKey(),
    binShape: this.binShape(),
    binSize: this.binSize(),
  }));

  constructor() {
    super(densityBinChart);
  }
}
