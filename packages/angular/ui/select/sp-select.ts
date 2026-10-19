import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { optionalBoolean, uiListKeys, uiOverlayNative } from '@silverpoint/angular/ui/overlay';
import { uiSelectedKey, uiSelectItems, uiSelectView, type UiItem } from '@silverpoint/core/ui';

/**
 * `<sp-select>`: the APG select-only combobox; `[(value)]` or forms, and `[(open)]` (REQ-494,
 * REQ-323, DD-039). Focus stays on the trigger, which points at the active option; every key goes
 * through `uiListKey` and `uiTypeahead`.
 */
@Component({
  selector: 'sp-select',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '(keydown)': 'keyed($event)', '(keyup)': 'list.keyUp($event)', '(pointerdown)': 'pressed($event)', '(click)': 'clicked($event)' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpSelect), multi: true }],
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpSelect extends SpUiControl<string | null> {
  readonly value = model<string | null>();
  readonly defaultValue = input<string | null>();
  readonly open = model<boolean>();
  readonly defaultOpen = input(undefined, { transform: optionalBoolean });
  readonly items = input.required<readonly (string | UiItem)[]>();
  readonly placeholder = input<string>();
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly width = input<string>();

  readonly isOpen = computed(() => this.open() ?? this.defaultOpen() ?? false);
  /** `null` is none chosen, not an absent value. */
  private readonly current = computed(() => {
    const value = this.value();
    return value !== undefined ? value : (this.defaultValue() ?? null);
  });
  private readonly options = computed(() => uiSelectItems(this.items()));
  protected readonly list = uiListKeys(
    this.options,
    'listbox',
    this.isOpen,
    computed(() => {
      const selected = uiSelectedKey(this.options(), this.current(), 'none');
      return this.options().findIndex((item) => item.key === selected);
    }),
  );

  protected readonly view = computed(() =>
    uiSelectView(
      {
        ...this.common(),
        items: this.items(),
        placeholder: this.placeholder(),
        label: this.label(),
        disabled: this.disabled() || this.formDisabled(),
        required: this.required(),
        name: this.name(),
        width: this.width(),
      },
      this.resolved(),
      { value: this.current(), open: this.isOpen(), active: this.list.activeKey() },
    ),
  );

  constructor() {
    super();
    uiOverlayNative(
      this,
      () => this.host.querySelector(':scope > sp-ui-tree > .sp-ui > [popover]'),
      () => 'popover',
      () => ({ place: { side: 'bottom', align: 'start' } }),
    );
  }

  /** Reports a change only, never the state the list is already in. */
  setOpen(next: boolean): void {
    if (next !== this.isOpen()) this.open.set(next);
  }

  private select(key: string | undefined): void {
    if (key !== undefined && key !== this.current()) this.commit(key);
    this.setOpen(false);
  }

  protected keyed(event: KeyboardEvent): void {
    if (!(event.target as Element).closest('[role="combobox"]')) return;
    const result = this.list.key(event);
    if (result?.intent === 'open') this.setOpen(true);
    else if (result?.intent === 'close') this.setOpen(false);
    else if (result?.intent === 'select') this.select(result.key);
  }

  protected pressed(event: Event): void {
    // The trigger keeps focus: the option is pointed at, never focused.
    if ((event.target as Element).closest('[role="option"]')) event.preventDefault();
  }

  protected clicked(event: Event): void {
    const target = event.target as Element;
    const option = target.closest('[role="option"]');
    if (option) {
      if (option.getAttribute('aria-disabled') !== 'true') this.select(option.getAttribute('data-key') ?? undefined);
    } else if (target.closest('[role="combobox"]')) this.setOpen(!this.isOpen());
  }

  override writeValue(value: string | null): void {
    this.value.set(value);
  }
}
