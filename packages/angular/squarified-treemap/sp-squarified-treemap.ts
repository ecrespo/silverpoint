import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { squarifiedTreemap, rootChangeOf } from '@silverpoint/core/catalog';
import type { SquarifiedTreemapProps } from '@silverpoint/core';

type Prop<K extends keyof SquarifiedTreemapProps> = SquarifiedTreemapProps[K];

/**
 * `<sp-squarified-treemap>` (REQ-416): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-squarified-treemap',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpSquarifiedTreemap extends SpChart<SquarifiedTreemapProps> {
  readonly idKey = input<Prop<'idKey'>>();
  readonly parentKey = input<Prop<'parentKey'>>();
  readonly labelKey = input<Prop<'labelKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly depth = input<Prop<'depth'>>();
  readonly rootId = input<Prop<'rootId'>>();

  protected readonly ownProps = computed(() => ({
    idKey: this.idKey(),
    parentKey: this.parentKey(),
    labelKey: this.labelKey(),
    valueKey: this.valueKey(),
    depth: this.depth(),
    rootId: this.rootId(),
  }));

  /** The node to draw as root, for the consumer to pass back as `rootId` (REQ-439); the chart keeps none. */
  readonly rootChange = output<string | null>();

  constructor() {
    super(squarifiedTreemap);
    this.select.subscribe((item) => this.rootChange.emit(rootChangeOf(this.rendered().geometry, item)));
  }
}
