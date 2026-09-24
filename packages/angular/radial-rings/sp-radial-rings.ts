import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { radialRings, type RadialRingsProps } from '@silverpoint/core';

type Prop<K extends keyof RadialRingsProps> = RadialRingsProps[K];

/**
 * `<sp-radial-rings>` (REQ-079): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-radial-rings',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpRadialRings extends SpChart<RadialRingsProps> {
  readonly nameKey = input<Prop<'nameKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();

  protected readonly ownProps = computed(() => ({
    nameKey: this.nameKey(),
    valueKey: this.valueKey(),
  }));

  constructor() {
    super(radialRings);
  }
}
