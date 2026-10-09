import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { intervalChart } from '@silverpoint/core/catalog';
import type { IntervalChartProps } from '@silverpoint/core';

type Prop<K extends keyof IntervalChartProps> = IntervalChartProps[K];

/**
 * `<sp-interval-chart>` (REQ-411): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-interval-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpIntervalChart extends SpChart<IntervalChartProps> {
  readonly laneKey = input<Prop<'laneKey'>>();
  readonly startKey = input<Prop<'startKey'>>();
  readonly endKey = input<Prop<'endKey'>>();
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly axis = input<Prop<'axis'>>();

  protected readonly ownProps = computed(() => ({
    laneKey: this.laneKey(),
    startKey: this.startKey(),
    endKey: this.endKey(),
    labelKey: this.labelKey(),
    axis: this.axis(),
  }));

  constructor() {
    super(intervalChart);
  }
}
