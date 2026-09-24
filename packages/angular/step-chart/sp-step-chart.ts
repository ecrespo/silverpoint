import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { stepChart, type StepChartProps } from '@silverpoint/core';

type Prop<K extends keyof StepChartProps> = StepChartProps[K];

/**
 * `<sp-step-chart>` (REQ-061): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-step-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpStepChart extends SpChart<StepChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly step = input<Prop<'step'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    valueKey: this.valueKey(),
    step: this.step(),
  }));

  constructor() {
    super(stepChart);
  }
}
