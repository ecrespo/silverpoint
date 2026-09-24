import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { activityGrid, type ActivityGridProps } from '@silverpoint/core';

type Prop<K extends keyof ActivityGridProps> = ActivityGridProps[K];

/**
 * `<sp-activity-grid>` (REQ-087): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-activity-grid',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpActivityGrid extends SpChart<ActivityGridProps> {
  readonly dateKey = input<Prop<'dateKey'>>();
  readonly countKey = input<Prop<'countKey'>>();
  readonly levelKey = input<Prop<'levelKey'>>();
  readonly weeks = input<Prop<'weeks'>>();

  protected readonly ownProps = computed(() => ({
    dateKey: this.dateKey(),
    countKey: this.countKey(),
    levelKey: this.levelKey(),
    weeks: this.weeks(),
  }));

  constructor() {
    super(activityGrid);
  }
}
