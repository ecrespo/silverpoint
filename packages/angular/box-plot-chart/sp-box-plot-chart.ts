import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { boxPlotChart } from '@silverpoint/core/catalog';
import type { BoxPlotChartProps } from '@silverpoint/core';

type Prop<K extends keyof BoxPlotChartProps> = BoxPlotChartProps[K];

/**
 * `<sp-box-plot-chart>` (REQ-402): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-box-plot-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpBoxPlotChart extends SpChart<BoxPlotChartProps> {
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly groupKey = input<Prop<'groupKey'>>();
  readonly whisker = input<Prop<'whisker'>>();
  readonly outliers = input<Prop<'outliers'>>();
  readonly orientation = input<Prop<'orientation'>>();

  protected readonly ownProps = computed(() => ({
    valueKey: this.valueKey(),
    groupKey: this.groupKey(),
    whisker: this.whisker(),
    outliers: this.outliers(),
    orientation: this.orientation(),
  }));

  constructor() {
    super(boxPlotChart);
  }
}
