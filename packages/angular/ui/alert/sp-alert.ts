import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiAlertView, type AlertKind } from '@silverpoint/core/ui';

/** `<sp-alert>`: `alert` or `status` by kind (REQ-318); closable, a close button that emits `(close)`. */
@Component({
  selector: 'sp-alert',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" (clicked)="close.emit()" />`,
})
export class SpAlert extends SpUiBase {
  readonly kind = input<AlertKind>();
  readonly title = input<string>();
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closeLabel = input<string>();
  /** From the close button of a closable alert. */
  readonly close = output<void>();

  protected readonly view = computed(() =>
    uiAlertView(
      { ...this.common(), kind: this.kind(), title: this.title(), closable: this.closable(), closeLabel: this.closeLabel() },
      this.resolved(),
      { closable: this.closable() },
    ),
  );
}
