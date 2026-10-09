import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { slopeChart } from '@silverpoint/core/catalog';
import type { SlopeChartProps } from '@silverpoint/core';

type Prop<K extends keyof SlopeChartProps> = SlopeChartProps[K];

/**
 * `<sp-slope-chart>` (REQ-408): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-slope-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpSlopeChart extends SpChart<SlopeChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly startKey = input<Prop<'startKey'>>();
  readonly endKey = input<Prop<'endKey'>>();
  readonly names = input<Prop<'names'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    startKey: this.startKey(),
    endKey: this.endKey(),
    names: this.names(),
  }));

  constructor() {
    super(slopeChart);
  }
}
