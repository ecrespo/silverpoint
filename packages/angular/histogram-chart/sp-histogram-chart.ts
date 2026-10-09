import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { histogramChart } from '@silverpoint/core/catalog';
import type { HistogramChartProps } from '@silverpoint/core';

type Prop<K extends keyof HistogramChartProps> = HistogramChartProps[K];

/**
 * `<sp-histogram-chart>` (REQ-400): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-histogram-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpHistogramChart extends SpChart<HistogramChartProps> {
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly bins = input<Prop<'bins'>>();
  readonly cumulative = input<Prop<'cumulative'>>();
  readonly orientation = input<Prop<'orientation'>>();

  protected readonly ownProps = computed(() => ({
    valueKey: this.valueKey(),
    bins: this.bins(),
    cumulative: this.cumulative(),
    orientation: this.orientation(),
  }));

  constructor() {
    super(histogramChart);
  }
}
