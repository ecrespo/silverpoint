import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { parallelCoordinatesChart } from '@silverpoint/core/catalog';
import type { ParallelCoordinatesChartProps } from '@silverpoint/core';

type Prop<K extends keyof ParallelCoordinatesChartProps> = ParallelCoordinatesChartProps[K];

/**
 * `<sp-parallel-coordinates-chart>` (REQ-419): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-parallel-coordinates-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpParallelCoordinatesChart extends SpChart<ParallelCoordinatesChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  /** Required, as in every adapter; ignored with the demo (REQ-099). */
  readonly dimensions = input.required<Prop<'dimensions'>>();
  readonly domains = input<Prop<'domains'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    dimensions: this.dimensions(),
    domains: this.domains(),
  }));

  constructor() {
    super(parallelCoordinatesChart);
  }
}
