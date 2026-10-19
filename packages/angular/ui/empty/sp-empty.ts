import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { SpCardExtra } from '@silverpoint/angular/ui/card';
import { uiEmptyView } from '@silverpoint/core/ui';

/** `<sp-empty>`: a toned tray and a description; `<ng-template spExtra>` holds actions (REQ-483). */
@Component({
  selector: 'sp-empty',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" [slots]="{ extra: extra()?.template }" />`,
})
export class SpEmpty extends SpUiBase {
  readonly description = input<string>();

  protected readonly extra = contentChild(SpCardExtra);

  protected readonly view = computed(() => uiEmptyView({ ...this.common(), description: this.description() }, this.resolved(), { extra: !!this.extra() }));
}
