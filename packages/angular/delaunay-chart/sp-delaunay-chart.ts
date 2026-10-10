import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { delaunayChart } from '@silverpoint/core/catalog';
import type { DelaunayChartProps } from '@silverpoint/core';

type Prop<K extends keyof DelaunayChartProps> = DelaunayChartProps[K];

/**
 * `<sp-delaunay-chart>` (REQ-424): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-delaunay-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpDelaunayChart extends SpChart<DelaunayChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly yKey = input<Prop<'yKey'>>();
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly mesh = input<Prop<'mesh'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    yKey: this.yKey(),
    labelKey: this.labelKey(),
    mesh: this.mesh(),
  }));

  constructor() {
    super(delaunayChart);
  }
}
