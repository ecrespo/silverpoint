import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiSkeletonView } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/** `<sp-skeleton>`: `aria-busy`, a hidden label, hidden toned shapes (REQ-318). */
@Component({
  selector: 'sp-skeleton',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpSkeleton extends SpUiBase {
  readonly lines = input(undefined, { transform: optionalNumber });
  readonly avatar = input(false, { transform: booleanAttribute });
  readonly label = input<string>();

  protected readonly view = computed(() => uiSkeletonView({ ...this.common(), lines: this.lines(), avatar: this.avatar(), label: this.label() }, this.resolved()));
}
