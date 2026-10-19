import { ChangeDetectionStrategy, Component, computed, contentChild, forwardRef, input } from '@angular/core';
import { SpUiTree } from '@silverpoint/angular/ui/base';
import { optionalBoolean, SP_TRIGGER_OWNER, SpUiToggledOverlay } from '@silverpoint/angular/ui/overlay';
import { SpCardFooter } from '@silverpoint/angular/ui/card';
import { uiModalView } from '@silverpoint/core/ui';

/**
 * `<sp-modal>`: a native `<dialog>` opened with `showModal()` after render, with `[(open)]`; a
 * projected `spTrigger` opens it and takes `aria-haspopup`, `aria-expanded` and `aria-controls`;
 * content projected, the footer as `<ng-template spFooter>` (REQ-491, REQ-502).
 */
@Component({
  selector: 'sp-modal',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: SP_TRIGGER_OWNER, useExisting: forwardRef(() => SpModal) }],
  template: `<ng-content select="[spTrigger]" /><ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content, footer: footer()?.template }" (clicked)="setOpen(false)" />`,
})
export class SpModal extends SpUiToggledOverlay {
  protected override readonly triggerKind = 'dialog' as const;
  readonly title = input<string>();
  readonly description = input<string>();
  readonly label = input<string>();
  readonly closable = input(undefined, { transform: optionalBoolean });
  readonly closeLabel = input<string>();
  readonly width = input<string>();
  readonly dismissible = input(undefined, { transform: optionalBoolean });

  protected readonly footer = contentChild(SpCardFooter);

  protected readonly view = computed(() =>
    uiModalView(
      { ...this.common(), title: this.title(), description: this.description(), label: this.label(), closable: this.closable(), closeLabel: this.closeLabel(), width: this.width(), dismissible: this.dismissible() },
      this.resolved(),
      { open: this.isOpen() },
      { footer: !!this.footer() },
    ),
  );

  constructor() {
    super();
    this.native(
      () => this.host.querySelector(':scope > sp-ui-tree > dialog'),
      () => 'modal',
      () => ({ dismissible: this.dismissible() }),
    );
  }
}
