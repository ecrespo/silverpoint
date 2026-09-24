import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { heatmapChart, type HeatmapChartProps } from '@silverpoint/core';

type Prop<K extends keyof HeatmapChartProps> = HeatmapChartProps[K];

/**
 * `<sp-heatmap-chart>` (REQ-084): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-heatmap-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpHeatmapChart extends SpChart<HeatmapChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly valuesKey = input<Prop<'valuesKey'>>();
  readonly scaleMax = input<Prop<'scaleMax'>>();
  readonly columnLabels = input<Prop<'columnLabels'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    valuesKey: this.valuesKey(),
    scaleMax: this.scaleMax(),
    columnLabels: this.columnLabels(),
  }));

  constructor() {
    super(heatmapChart);
  }
}
