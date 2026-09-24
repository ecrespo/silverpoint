import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { volvelleChart, type VolvelleChartProps } from '@silverpoint/core';

type Prop<K extends keyof VolvelleChartProps> = VolvelleChartProps[K];

/**
 * `<sp-volvelle-chart>` (REQ-090): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-volvelle-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpVolvelleChart extends SpChart<VolvelleChartProps> {
  readonly rings = input<Prop<'rings'>>();
  readonly indexRing = input<Prop<'indexRing'>>();
  readonly indexValue = input<Prop<'indexValue'>>();

  protected readonly ownProps = computed(() => ({
    rings: this.rings(),
    indexRing: this.indexRing(),
    indexValue: this.indexValue(),
  }));

  constructor() {
    super(volvelleChart);
  }
}
