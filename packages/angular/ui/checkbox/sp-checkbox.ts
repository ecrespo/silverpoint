import { afterRenderEffect, booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, inject, input, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiCheckboxView } from '@silverpoint/core/ui';

/** `<sp-checkbox>`: a native checkbox, hidden for sight, in its `<label>`; `[(value)]` or forms (REQ-322, REQ-323). */
@Component({
  selector: 'sp-checkbox',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpCheckbox), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeChange)="toggled($event)" />`,
})
export class SpCheckbox extends SpUiBase implements ControlValueAccessor {
  readonly value = model<boolean>();
  readonly defaultValue = input(undefined, { transform: (v: unknown) => (v === undefined ? undefined : booleanAttribute(v)) });
  readonly label = input.required<string>();
  readonly name = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });

  private readonly formDisabled = signal(false);
  private notify: (value: boolean) => void = () => {};
  private touched: () => void = () => {};

  protected readonly view = computed(() =>
    uiCheckboxView(
      { ...this.common(), label: this.label(), name: this.name(), disabled: this.disabled() || this.formDisabled(), indeterminate: this.indeterminate() },
      this.resolved(),
      { checked: this.value() ?? this.defaultValue() ?? false },
    ),
  );

  constructor() {
    super();
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // `indeterminate` is a property, not an attribute: set after render, so server and client agree.
    afterRenderEffect(() => {
      const native = host.querySelector('input');
      if (native) native.indeterminate = this.indeterminate();
    });
  }

  protected toggled(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.value.set(checked);
    this.notify(checked);
    this.touched();
  }

  writeValue(value: boolean | null): void {
    this.value.set(value === true);
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.notify = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
