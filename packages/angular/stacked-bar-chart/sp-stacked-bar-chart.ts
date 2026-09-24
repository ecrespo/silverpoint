import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { stackedBarChart, type StackedBarChartProps } from '@silverpoint/core';

type Prop<K extends keyof StackedBarChartProps> = StackedBarChartProps[K];

/**
 * `<sp-stacked-bar-chart>` (REQ-065): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-stacked-bar-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpStackedBarChart extends SpChart<StackedBarChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly keys = input<Prop<'keys'>>();
  readonly names = input<Prop<'names'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    keys: this.keys(),
    names: this.names(),
  }));

  constructor() {
    super(stackedBarChart);
  }
}
