import { booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, Directive, forwardRef, inject, input, model, signal, TemplateRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiInputView, type SpInputProps } from '@silverpoint/core/ui';

/** `<ng-template spPrefix>`: content before the control. */
@Directive({ selector: 'ng-template[spPrefix]' })
export class SpInputPrefix {
  readonly template = inject(TemplateRef);
}

/** `<ng-template spSuffix>`: content after the control. */
@Directive({ selector: 'ng-template[spSuffix]' })
export class SpInputSuffix {
  readonly template = inject(TemplateRef);
}

/**
 * `<sp-input>`: a native `<input>` in a framed box. An element, not an attribute on `<input>`: an
 * input can hold neither the frame nor the message (API delta §4). `[(value)]` or any forms
 * directive through ControlValueAccessor (REQ-322, REQ-323).
 */
@Component({
  selector: 'sp-input',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpInput), multi: true }],
  template: `<sp-ui-tree [node]="view()" [slots]="{ prefix: prefix()?.template, suffix: suffix()?.template }" (nativeInput)="typed($event)" />`,
})
export class SpInput extends SpUiBase implements ControlValueAccessor {
  readonly value = model<string>();
  readonly defaultValue = input<string>();
  readonly type = input<SpInputProps['type']>();
  readonly placeholder = input<string>();
  readonly name = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly message = input<string>();
  readonly label = input<string>();

  protected readonly prefix = contentChild(SpInputPrefix);
  protected readonly suffix = contentChild(SpInputSuffix);
  private readonly formDisabled = signal(false);
  private notify: (value: string) => void = () => {};
  private touched: () => void = () => {};

  protected readonly view = computed(() =>
    uiInputView(
      {
        ...this.common(),
        type: this.type(),
        placeholder: this.placeholder(),
        name: this.name(),
        disabled: this.disabled() || this.formDisabled(),
        readOnly: this.readOnly(),
        invalid: this.invalid(),
        message: this.message(),
        label: this.label(),
      },
      this.resolved(),
      { value: this.value() ?? this.defaultValue() ?? '', prefix: !!this.prefix(), suffix: !!this.suffix() },
    ),
  );

  protected typed(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.notify(value);
    this.touched();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.notify = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
