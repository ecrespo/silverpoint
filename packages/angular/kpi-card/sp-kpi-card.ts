import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { kpiCard, type KpiCardProps } from '@silverpoint/core';

type Prop<K extends keyof KpiCardProps> = KpiCardProps[K];

/**
 * `<sp-kpi-card>` (REQ-063): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-kpi-card',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpKpiCard extends SpChart<KpiCardProps> {
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly metric = input<Prop<'metric'>>();
  readonly delta = input<Prop<'delta'>>();
  readonly deltaTone = input<Prop<'deltaTone'>>();

  protected readonly ownProps = computed(() => ({
    valueKey: this.valueKey(),
    metric: this.metric(),
    delta: this.delta(),
    deltaTone: this.deltaTone(),
  }));

  constructor() {
    super(kpiCard);
  }
}
