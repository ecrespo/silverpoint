import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { pyramidChart, type PyramidChartProps } from '@silverpoint/core';

type Prop<K extends keyof PyramidChartProps> = PyramidChartProps[K];

/**
 * `<sp-pyramid-chart>` (REQ-070): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-pyramid-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpPyramidChart extends SpChart<PyramidChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly widthKey = input<Prop<'widthKey'>>();
  readonly toneKey = input<Prop<'toneKey'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    widthKey: this.widthKey(),
    toneKey: this.toneKey(),
  }));

  constructor() {
    super(pyramidChart);
  }
}
