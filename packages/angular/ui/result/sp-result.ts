import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { SpCardExtra } from '@silverpoint/angular/ui/card';
import { uiResultView, type AlertKind, type SpResultProps } from '@silverpoint/core/ui';

/** `<sp-result>`: the status glyph in a round frame; `<ng-template spExtra>` holds actions (REQ-483). */
@Component({
  selector: 'sp-result',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" [slots]="{ extra: extra()?.template }" />`,
})
export class SpResult extends SpUiBase {
  readonly status = input<AlertKind>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly headingLevel = input<SpResultProps['headingLevel']>();

  protected readonly extra = contentChild(SpCardExtra);

  protected readonly view = computed(() =>
    uiResultView(
      { ...this.common(), status: this.status(), title: this.title(), subtitle: this.subtitle(), headingLevel: this.headingLevel() },
      this.resolved(),
      { extra: !!this.extra() },
    ),
  );
}
