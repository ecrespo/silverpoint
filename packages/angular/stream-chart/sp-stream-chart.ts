import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { streamChart, type StreamChartProps } from '@silverpoint/core';

type Prop<K extends keyof StreamChartProps> = StreamChartProps[K];

/**
 * `<sp-stream-chart>` (REQ-074): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-stream-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpStreamChart extends SpChart<StreamChartProps> {
  readonly xKey = input<Prop<'xKey'>>();
  readonly keys = input<Prop<'keys'>>();
  readonly stacked = input<Prop<'stacked'>>();

  protected readonly ownProps = computed(() => ({
    xKey: this.xKey(),
    keys: this.keys(),
    stacked: this.stacked(),
  }));

  constructor() {
    super(streamChart);
  }
}
