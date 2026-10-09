import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { errorBarChart } from '@silverpoint/core/catalog';
import type { ErrorBarChartProps } from '@silverpoint/core';

type Prop<K extends keyof ErrorBarChartProps> = ErrorBarChartProps[K];

/**
 * `<sp-error-bar-chart>` (REQ-410): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-error-bar-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpErrorBarChart extends SpChart<ErrorBarChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly estimateKey = input<Prop<'estimateKey'>>();
  readonly lowKey = input<Prop<'lowKey'>>();
  readonly highKey = input<Prop<'highKey'>>();
  readonly reference = input<Prop<'reference'>>();
  readonly orientation = input<Prop<'orientation'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    estimateKey: this.estimateKey(),
    lowKey: this.lowKey(),
    highKey: this.highKey(),
    reference: this.reference(),
    orientation: this.orientation(),
  }));

  constructor() {
    super(errorBarChart);
  }
}
