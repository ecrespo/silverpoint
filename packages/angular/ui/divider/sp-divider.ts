import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiDividerView, type SpDividerProps } from '@silverpoint/core/ui';

/** `<sp-divider>`: a `separator`. */
@Component({
  selector: 'sp-divider',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpDivider extends SpUiBase {
  readonly orientation = input<SpDividerProps['orientation']>();
  readonly text = input<string>();
  readonly align = input<SpDividerProps['align']>();

  protected readonly view = computed(() => uiDividerView({ ...this.common(), orientation: this.orientation(), text: this.text(), align: this.align() }, this.resolved()));
}
