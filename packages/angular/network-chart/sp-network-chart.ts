import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { networkChart } from '@silverpoint/core/catalog';
import type { NetworkChartProps } from '@silverpoint/core';

type Prop<K extends keyof NetworkChartProps> = NetworkChartProps[K];

/**
 * `<sp-network-chart>` (REQ-426): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-network-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpNetworkChart extends SpChart<NetworkChartProps> {
  readonly sourceKey = input<Prop<'sourceKey'>>();
  readonly targetKey = input<Prop<'targetKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly nodes = input<Prop<'nodes'>>();
  readonly iterations = input<Prop<'iterations'>>();

  protected readonly ownProps = computed(() => ({
    sourceKey: this.sourceKey(),
    targetKey: this.targetKey(),
    valueKey: this.valueKey(),
    nodes: this.nodes(),
    iterations: this.iterations(),
  }));

  constructor() {
    super(networkChart);
  }
}
