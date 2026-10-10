import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { contourChart } from '@silverpoint/core/catalog';
import type { ContourChartProps } from '@silverpoint/core';

type Prop<K extends keyof ContourChartProps> = ContourChartProps[K];

/**
 * `<sp-contour-chart>` (REQ-423): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-contour-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpContourChart extends SpChart<ContourChartProps> {
  readonly source = input<Prop<'source'>>();
  readonly xKey = input<Prop<'xKey'>>();
  readonly yKey = input<Prop<'yKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly levels = input<Prop<'levels'>>();
  readonly filled = input<Prop<'filled'>>();

  protected readonly ownProps = computed(() => ({
    source: this.source(),
    xKey: this.xKey(),
    yKey: this.yKey(),
    valueKey: this.valueKey(),
    levels: this.levels(),
    filled: this.filled(),
  }));

  constructor() {
    super(contourChart);
  }
}
