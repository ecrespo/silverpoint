import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { orbitChart, type OrbitChartProps } from '@silverpoint/core';

type Prop<K extends keyof OrbitChartProps> = OrbitChartProps[K];

/**
 * `<sp-orbit-chart>` (REQ-092): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-orbit-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpOrbitChart extends SpChart<OrbitChartProps> {
  readonly orbits = input<Prop<'orbits'>>();
  readonly markerKey = input<Prop<'markerKey'>>();
  readonly periodKey = input<Prop<'periodKey'>>();

  protected readonly ownProps = computed(() => ({
    orbits: this.orbits(),
    markerKey: this.markerKey(),
    periodKey: this.periodKey(),
  }));

  constructor() {
    super(orbitChart);
  }
}
