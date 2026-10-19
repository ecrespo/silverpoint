import { ChangeDetectionStrategy, Component, computed, contentChild, forwardRef, input } from '@angular/core';
import { SpUiTree } from '@silverpoint/angular/ui/base';
import { optionalBoolean, SP_TRIGGER_OWNER, SpUiToggledOverlay } from '@silverpoint/angular/ui/overlay';
import { SpCardFooter } from '@silverpoint/angular/ui/card';
import { uiDrawerView, type SpDrawerProps } from '@silverpoint/core/ui';

/** `<sp-drawer>`: the Modal's dialog on a logical side; `[modal]="false"` opens it with `show()` (REQ-491). */
@Component({
  selector: 'sp-drawer',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: SP_TRIGGER_OWNER, useExisting: forwardRef(() => SpDrawer) }],
  template: `<ng-content select="[spTrigger]" /><ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content, footer: footer()?.template }" (clicked)="setOpen(false)" />`,
})
export class SpDrawer extends SpUiToggledOverlay {
  protected override readonly triggerKind = 'dialog' as const;
  readonly title = input<string>();
  readonly description = input<string>();
  readonly label = input<string>();
  readonly closable = input(undefined, { transform: optionalBoolean });
  readonly closeLabel = input<string>();
  readonly dismissible = input(undefined, { transform: optionalBoolean });
  readonly side = input<SpDrawerProps['side']>();
  readonly extent = input<string>();
  readonly modal = input(undefined, { transform: optionalBoolean });

  protected readonly footer = contentChild(SpCardFooter);

  protected readonly view = computed(() =>
    uiDrawerView(
      {
        ...this.common(),
        title: this.title(),
        description: this.description(),
        label: this.label(),
        closable: this.closable(),
        closeLabel: this.closeLabel(),
        dismissible: this.dismissible(),
        side: this.side(),
        extent: this.extent(),
        modal: this.modal(),
      },
      this.resolved(),
      { open: this.isOpen() },
      { footer: !!this.footer() },
    ),
  );

  constructor() {
    super();
    this.native(
      () => this.host.querySelector(':scope > sp-ui-tree > dialog'),
      () => (this.modal() === false ? 'dialog' : 'modal'),
      () => ({ dismissible: this.dismissible() }),
    );
  }
}
