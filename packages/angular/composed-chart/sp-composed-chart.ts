import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { composedChart, type ComposedChartProps } from '@silverpoint/core';

type Prop<K extends keyof ComposedChartProps> = ComposedChartProps[K];

/**
 * `<sp-composed-chart>` (REQ-066): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-composed-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpComposedChart extends SpChart<ComposedChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly barKey = input<Prop<'barKey'>>();
  readonly lineKey = input<Prop<'lineKey'>>();
  readonly showLine = input<Prop<'showLine'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    barKey: this.barKey(),
    lineKey: this.lineKey(),
    showLine: this.showLine(),
  }));

  constructor() {
    super(composedChart);
  }
}
