import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { funnelChart, type FunnelChartProps } from '@silverpoint/core';

type Prop<K extends keyof FunnelChartProps> = FunnelChartProps[K];

/**
 * `<sp-funnel-chart>` (REQ-068): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-funnel-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpFunnelChart extends SpChart<FunnelChartProps> {
  readonly stageKey = input<Prop<'stageKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();

  protected readonly ownProps = computed(() => ({
    stageKey: this.stageKey(),
    valueKey: this.valueKey(),
  }));

  constructor() {
    super(funnelChart);
  }
}
