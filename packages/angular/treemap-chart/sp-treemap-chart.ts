import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { treemapChart, type TreemapChartProps } from '@silverpoint/core';

type Prop<K extends keyof TreemapChartProps> = TreemapChartProps[K];

/**
 * `<sp-treemap-chart>` (REQ-085): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-treemap-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpTreemapChart extends SpChart<TreemapChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly shareKey = input<Prop<'shareKey'>>();
  readonly columns = input<Prop<'columns'>>();
  readonly rows = input<Prop<'rows'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    shareKey: this.shareKey(),
    columns: this.columns(),
    rows: this.rows(),
  }));

  constructor() {
    super(treemapChart);
  }
}
