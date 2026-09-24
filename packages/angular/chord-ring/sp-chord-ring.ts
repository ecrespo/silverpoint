import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { chordRing, type ChordRingProps } from '@silverpoint/core';

type Prop<K extends keyof ChordRingProps> = ChordRingProps[K];

/**
 * `<sp-chord-ring>` (REQ-091): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-chord-ring',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpChordRing extends SpChart<ChordRingProps> {
  readonly sourceKey = input<Prop<'sourceKey'>>();
  readonly targetKey = input<Prop<'targetKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly maxCategories = input<Prop<'maxCategories'>>();

  protected readonly ownProps = computed(() => ({
    sourceKey: this.sourceKey(),
    targetKey: this.targetKey(),
    valueKey: this.valueKey(),
    maxCategories: this.maxCategories(),
  }));

  constructor() {
    super(chordRing);
  }
}
