import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { waterfallChart, type WaterfallChartProps } from '@silverpoint/core';

type Prop<K extends keyof WaterfallChartProps> = WaterfallChartProps[K];

/**
 * `<sp-waterfall-chart>` (REQ-067): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-waterfall-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpWaterfallChart extends SpChart<WaterfallChartProps> {
  readonly stepKey = input<Prop<'stepKey'>>();
  readonly baseKey = input<Prop<'baseKey'>>();
  readonly deltaKey = input<Prop<'deltaKey'>>();

  protected readonly ownProps = computed(() => ({
    stepKey: this.stepKey(),
    baseKey: this.baseKey(),
    deltaKey: this.deltaKey(),
  }));

  constructor() {
    super(waterfallChart);
  }
}
