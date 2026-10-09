import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { ecdfChart } from '@silverpoint/core/catalog';
import type { EcdfChartProps } from '@silverpoint/core';

type Prop<K extends keyof EcdfChartProps> = EcdfChartProps[K];

/**
 * `<sp-ecdf-chart>` (REQ-401): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-ecdf-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpEcdfChart extends SpChart<EcdfChartProps> {
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly groupKey = input<Prop<'groupKey'>>();
  readonly markers = input<Prop<'markers'>>();

  protected readonly ownProps = computed(() => ({
    valueKey: this.valueKey(),
    groupKey: this.groupKey(),
    markers: this.markers(),
  }));

  constructor() {
    super(ecdfChart);
  }
}
