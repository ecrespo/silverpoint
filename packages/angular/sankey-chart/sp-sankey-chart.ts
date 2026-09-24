import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { sankeyChart, type SankeyChartProps } from '@silverpoint/core';

type Prop<K extends keyof SankeyChartProps> = SankeyChartProps[K];

/**
 * `<sp-sankey-chart>` (REQ-086): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-sankey-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpSankeyChart extends SpChart<SankeyChartProps> {
  readonly sourceKey = input<Prop<'sourceKey'>>();
  readonly targetKey = input<Prop<'targetKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();

  protected readonly ownProps = computed(() => ({
    sourceKey: this.sourceKey(),
    targetKey: this.targetKey(),
    valueKey: this.valueKey(),
  }));

  constructor() {
    super(sankeyChart);
  }
}
