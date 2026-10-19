import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input } from '@angular/core';
import { SpUiTree } from '@silverpoint/angular/ui/base';
import { SP_TRIGGER_OWNER, SpUiToggledOverlay } from '@silverpoint/angular/ui/overlay';
import { uiPopoverView, type SpPopoverProps } from '@silverpoint/core/ui';

/** `<sp-popover>`: an `auto` popover with the dialog role, hung from its `spTrigger` by `uiAnchor` (REQ-492, REQ-493). */
@Component({
  selector: 'sp-popover',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: SP_TRIGGER_OWNER, useExisting: forwardRef(() => SpPopover) }],
  template: `<ng-content select="[spTrigger]" /><ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" (clicked)="setOpen(false)" />`,
})
export class SpPopover extends SpUiToggledOverlay {
  protected override readonly triggerKind = 'popover' as const;
  readonly title = input<string>();
  readonly label = input<string>();
  readonly side = input<SpPopoverProps['side']>();
  readonly align = input<SpPopoverProps['align']>();
  readonly offset = input<number>();
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closeLabel = input<string>();
  readonly width = input<string>();

  protected readonly view = computed(() =>
    uiPopoverView(
      { ...this.common(), title: this.title(), label: this.label(), side: this.side(), align: this.align(), offset: this.offset(), closable: this.closable(), closeLabel: this.closeLabel(), width: this.width() },
      this.resolved(),
      { open: this.isOpen() },
    ),
  );

  constructor() {
    super();
    this.native(
      () => this.host.querySelector(':scope > sp-ui-tree > [popover]'),
      () => 'popover',
      () => ({ place: { side: this.side() ?? 'bottom', align: this.align() ?? 'center', offset: this.offset() } }),
    );
  }
}
