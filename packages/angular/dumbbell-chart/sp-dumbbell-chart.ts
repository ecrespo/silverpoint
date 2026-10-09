import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { dumbbellChart } from '@silverpoint/core/catalog';
import type { DumbbellChartProps } from '@silverpoint/core';

type Prop<K extends keyof DumbbellChartProps> = DumbbellChartProps[K];

/**
 * `<sp-dumbbell-chart>` (REQ-407): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-dumbbell-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpDumbbellChart extends SpChart<DumbbellChartProps> {
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly startKey = input<Prop<'startKey'>>();
  readonly endKey = input<Prop<'endKey'>>();
  readonly names = input<Prop<'names'>>();
  readonly endMarker = input<Prop<'endMarker'>>();
  readonly orientation = input<Prop<'orientation'>>();

  protected readonly ownProps = computed(() => ({
    labelKey: this.labelKey(),
    startKey: this.startKey(),
    endKey: this.endKey(),
    names: this.names(),
    endMarker: this.endMarker(),
    orientation: this.orientation(),
  }));

  constructor() {
    super(dumbbellChart);
  }
}
