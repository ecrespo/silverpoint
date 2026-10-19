import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiStatisticView, type SpStatisticProps } from '@silverpoint/core/ui';

/** `<sp-statistic>`: the trend by an exact arrow and by text (REQ-479). */
@Component({
  selector: 'sp-statistic',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpStatistic extends SpUiBase {
  readonly title = input.required<string>();
  readonly value = input.required<SpStatisticProps['value']>();
  readonly prefix = input<string>();
  readonly suffix = input<string>();
  readonly trend = input<SpStatisticProps['trend']>();
  readonly delta = input<string>();

  protected readonly view = computed(() =>
    uiStatisticView(
      { ...this.common(), title: this.title(), value: this.value(), prefix: this.prefix(), suffix: this.suffix(), trend: this.trend(), delta: this.delta() },
      this.resolved(),
    ),
  );
}
