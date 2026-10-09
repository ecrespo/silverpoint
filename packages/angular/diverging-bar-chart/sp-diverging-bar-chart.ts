import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { divergingBarChart } from '@silverpoint/core/catalog';
import type { DivergingBarChartProps } from '@silverpoint/core';

type Prop<K extends keyof DivergingBarChartProps> = DivergingBarChartProps[K];

/**
 * `<sp-diverging-bar-chart>` (REQ-412): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-diverging-bar-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpDivergingBarChart extends SpChart<DivergingBarChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  /** Required, as in every adapter; ignored with the demo (REQ-099). */
  readonly levels = input.required<Prop<'levels'>>();
  readonly neutral = input<Prop<'neutral'>>();
  readonly percent = input<Prop<'percent'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    levels: this.levels(),
    neutral: this.neutral(),
    percent: this.percent(),
  }));

  constructor() {
    super(divergingBarChart);
  }
}
