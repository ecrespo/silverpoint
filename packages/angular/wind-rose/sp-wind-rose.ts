import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { windRose, type WindRoseProps } from '@silverpoint/core';

type Prop<K extends keyof WindRoseProps> = WindRoseProps[K];

/**
 * `<sp-wind-rose>` (REQ-089): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-wind-rose',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpWindRose extends SpChart<WindRoseProps> {
  readonly bearingKey = input<Prop<'bearingKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly sectors = input<Prop<'sectors'>>();
  readonly bins = input<Prop<'bins'>>();

  protected readonly ownProps = computed(() => ({
    bearingKey: this.bearingKey(),
    valueKey: this.valueKey(),
    sectors: this.sectors(),
    bins: this.bins(),
  }));

  constructor() {
    super(windRose);
  }
}
