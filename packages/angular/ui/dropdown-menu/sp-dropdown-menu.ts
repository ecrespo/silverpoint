import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, forwardRef, input, output } from '@angular/core';
import { SpUiTree } from '@silverpoint/angular/ui/base';
import { SP_TRIGGER_OWNER, SpUiOverlay, uiListKeys } from '@silverpoint/angular/ui/overlay';
import { uiDropdownMenuView, uiMenuItems, type MenuEntry, type SpDropdownMenuProps } from '@silverpoint/core/ui';

/**
 * `<sp-dropdown-menu>`: the APG menu button, with `[(open)]` and a `(select)` carrying the key
 * (REQ-495, DD-039). DOM focus moves to the active item; every key goes through `uiListKey` and
 * `uiTypeahead`; Enter, Space or a click activates an item, closes the menu and returns focus to
 * the trigger. A projected `spTrigger` replaces the built-in button.
 */
@Component({
  selector: 'sp-dropdown-menu',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '(keydown)': 'keyed($event)', '(keyup)': 'list.keyUp($event)', '(pointerdown)': 'pressed($event)', '(click)': 'clicked($event)' },
  providers: [{ provide: SP_TRIGGER_OWNER, useExisting: forwardRef(() => SpDropdownMenu) }],
  template: `<ng-template #slot><ng-content select="[spTrigger]" /></ng-template><sp-ui-tree [node]="view()" [slots]="{ trigger: slot }" />`,
})
export class SpDropdownMenu extends SpUiOverlay {
  protected override readonly triggerKind = 'menu' as const;
  readonly items = input.required<readonly MenuEntry[]>();
  readonly label = input.required<string>();
  readonly side = input<SpDropdownMenuProps['side']>();
  readonly align = input<SpDropdownMenuProps['align']>();
  /** An item was activated: its key. The menu closes. */
  readonly select = output<string>();

  private readonly entries = computed(() => uiMenuItems(this.items()));
  protected readonly list = uiListKeys(this.entries, 'menu', this.isOpen, computed(() => -1));

  protected readonly view = computed(() =>
    uiDropdownMenuView(
      { ...this.common(), items: this.items(), label: this.label(), side: this.side(), align: this.align() },
      this.resolved(),
      { open: this.isOpen(), active: this.list.activeKey() },
      { trigger: !!this.trigger() },
    ),
  );

  private readonly menu = () => this.host.querySelector<HTMLElement>(':scope > sp-ui-tree > .sp-ui > [popover]');
  private pressedOpen = false;

  constructor() {
    super();
    this.native(this.menu, () => 'popover', () => ({ place: { side: this.side() ?? 'bottom', align: this.align() ?? 'start' } }));
    afterRenderEffect(() => {
      const key = this.list.activeKey();
      if (!this.isOpen() || key === null) return;
      this.menu()?.querySelector<HTMLElement>(`[role="menuitem"][data-key="${CSS.escape(key)}"]`)?.focus();
    });
  }

  /** The element focus returns to: the projected trigger, or the built-in button. */
  private triggerElement(): HTMLElement | null | undefined {
    return this.trigger()?.element ?? (this.menu()?.previousElementSibling as HTMLElement | null | undefined);
  }

  private close(refocus: boolean): void {
    this.setOpen(false);
    if (refocus) this.triggerElement()?.focus();
  }

  private activate(key: string | undefined): void {
    this.close(true);
    if (key !== undefined) this.select.emit(key);
  }

  private onTrigger(target: Element): boolean {
    return target.closest('.sp-ui-menu-trigger, .sp-ui-trigger') !== null;
  }

  protected keyed(event: KeyboardEvent): void {
    const target = event.target as Element;
    const inMenu = target.closest('[role="menu"]') !== null;
    if (!inMenu && !(this.onTrigger(target) && !this.isOpen())) return;
    const result = this.list.key(event);
    if (result?.intent === 'open') this.setOpen(true);
    else if (result?.intent === 'close') this.close(event.key !== 'Tab');
    else if (result?.intent === 'select') this.activate(result.key);
  }

  protected pressed(event: Event): void {
    if (this.onTrigger(event.target as Element)) this.pressedOpen = this.isOpen();
  }

  protected clicked(event: Event): void {
    const target = event.target as Element;
    const item = target.closest('[role="menuitem"]');
    if (item) {
      if (item.getAttribute('aria-disabled') !== 'true') this.activate(item.getAttribute('data-key') ?? undefined);
    } else if (this.onTrigger(target)) {
      const wasOpen = this.pressedOpen || this.isOpen();
      this.pressedOpen = false;
      this.setOpen(!wasOpen);
    }
  }
}
