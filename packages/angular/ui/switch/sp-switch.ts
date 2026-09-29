import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiSwitchView } from '@silverpoint/core/ui';

/** `<sp-switch>`: a native checkbox with `role="switch"`; `[(value)]` or forms (REQ-322, REQ-323). */
@Component({
  selector: 'sp-switch',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpSwitch), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeChange)="toggled($event)" />`,
})
export class SpSwitch extends SpUiBase implements ControlValueAccessor {
  readonly value = model<boolean>();
  readonly defaultValue = input(undefined, { transform: (v: unknown) => (v === undefined ? undefined : booleanAttribute(v)) });
  readonly label = input.required<string>();
  readonly name = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly formDisabled = signal(false);
  private notify: (value: boolean) => void = () => {};
  private touched: () => void = () => {};

  protected readonly view = computed(() =>
    uiSwitchView(
      { ...this.common(), label: this.label(), name: this.name(), disabled: this.disabled() || this.formDisabled() },
      this.resolved(),
      { checked: this.value() ?? this.defaultValue() ?? false },
    ),
  );


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
