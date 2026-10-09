import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { connectedScatterChart } from '@silverpoint/core/catalog';
import type { ConnectedScatterChartProps } from '@silverpoint/core';

type Prop<K extends keyof ConnectedScatterChartProps> = ConnectedScatterChartProps[K];

/**
 * `<sp-connected-scatter-chart>` (REQ-413): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-connected-scatter-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpConnectedScatterChart extends SpChart<ConnectedScatterChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly yKey = input<Prop<'yKey'>>();
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly arrows = input<Prop<'arrows'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    yKey: this.yKey(),
    labelKey: this.labelKey(),
    arrows: this.arrows(),
  }));

  constructor() {
    super(connectedScatterChart);
  }
}
