import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { marimekkoChart } from '@silverpoint/core/catalog';
import type { MarimekkoChartProps } from '@silverpoint/core';

type Prop<K extends keyof MarimekkoChartProps> = MarimekkoChartProps[K];

/**
 * `<sp-marimekko-chart>` (REQ-415): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-marimekko-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpMarimekkoChart extends SpChart<MarimekkoChartProps> {
  readonly columnKey = input<Prop<'columnKey'>>();
  readonly segmentKey = input<Prop<'segmentKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();

  protected readonly ownProps = computed(() => ({
    columnKey: this.columnKey(),
    segmentKey: this.segmentKey(),
    valueKey: this.valueKey(),
  }));

  constructor() {
    super(marimekkoChart);
  }
}
