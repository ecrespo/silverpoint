import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpChart, SpChartFrame, SpChartOverlay } from '@silverpoint/angular';
import { bulletChart, type BulletChartProps } from '@silverpoint/core';

type Prop<K extends keyof BulletChartProps> = BulletChartProps[K];

/**
 * `<sp-bullet-chart>` (REQ-069): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-bullet-chart',
  imports: [SpChartFrame, SpChartOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
      <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
    </sp-chart-frame>
  `,
})
export class SpBulletChart extends SpChart<BulletChartProps> {
  readonly titleKey = input<Prop<'titleKey'>>();
  readonly actualKey = input<Prop<'actualKey'>>();
  readonly targetKey = input<Prop<'targetKey'>>();

  protected readonly ownProps = computed(() => ({
    titleKey: this.titleKey(),
    actualKey: this.actualKey(),
    targetKey: this.targetKey(),
  }));

  constructor() {
    super(bulletChart);
  }
}
