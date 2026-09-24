import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { bubbleChart, type BubbleChartProps } from '@silverpoint/core';

type Prop<K extends keyof BubbleChartProps> = BubbleChartProps[K];

/**
 * `<sp-bubble-chart>` (REQ-083): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-bubble-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpBubbleChart extends SpChart<BubbleChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly yKey = input<Prop<'yKey'>>();
  readonly sizeKey = input<Prop<'sizeKey'>>();
  readonly sizeRange = input<Prop<'sizeRange'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    yKey: this.yKey(),
    sizeKey: this.sizeKey(),
    sizeRange: this.sizeRange(),
  }));

  constructor() {
    super(bubbleChart);
  }
}
