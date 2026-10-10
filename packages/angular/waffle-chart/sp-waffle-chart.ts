import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { waffleChart } from '@silverpoint/core/catalog';
import type { WaffleChartProps } from '@silverpoint/core';

type Prop<K extends keyof WaffleChartProps> = WaffleChartProps[K];

/**
 * `<sp-waffle-chart>` (REQ-414): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-waffle-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpWaffleChart extends SpChart<WaffleChartProps> {
  readonly nameKey = input<Prop<'nameKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly cells = input<Prop<'cells'>>();
  readonly columns = input<Prop<'columns'>>();

  protected readonly ownProps = computed(() => ({
    nameKey: this.nameKey(),
    valueKey: this.valueKey(),
    cells: this.cells(),
    columns: this.columns(),
  }));

  constructor() {
    super(waffleChart);
  }
}
