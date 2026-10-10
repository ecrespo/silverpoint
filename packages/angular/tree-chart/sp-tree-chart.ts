import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { treeChart } from '@silverpoint/core/catalog';
import type { TreeChartProps } from '@silverpoint/core';

type Prop<K extends keyof TreeChartProps> = TreeChartProps[K];

/**
 * `<sp-tree-chart>` (REQ-418): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-tree-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpTreeChart extends SpChart<TreeChartProps> {
  readonly idKey = input<Prop<'idKey'>>();
  readonly parentKey = input<Prop<'parentKey'>>();
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly orientation = input<Prop<'orientation'>>();

  protected readonly ownProps = computed(() => ({
    idKey: this.idKey(),
    parentKey: this.parentKey(),
    labelKey: this.labelKey(),
    valueKey: this.valueKey(),
    orientation: this.orientation(),
  }));

  constructor() {
    super(treeChart);
  }
}
