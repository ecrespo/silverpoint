import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, numberAttribute } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiInputNumberView, uiNumberStep, uiNumberValue } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/**
 * `<sp-input-number>`: a native number input between exact steppers; `[(value)]` or forms (REQ-485,
 * REQ-488). What is typed stays in the field until committed (`change`: blur or Enter), so a bound
 * never interrupts typing; the committed value is the core's `uiNumberValue`, a stepper's `uiNumberStep`.
 */
@Component({
  selector: 'sp-input-number',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpInputNumber), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeChange)="committed($event)" (clicked)="stepped($event)" />`,
})
export class SpInputNumber extends SpUiControl<number | null> {
  readonly value = model<number | null>();
  readonly defaultValue = input<number | null | undefined, unknown>(undefined, { transform: (v: unknown) => (v === null ? null : optionalNumber(v)) });
  readonly min = input(undefined, { transform: optionalNumber });
  readonly max = input(undefined, { transform: optionalNumber });
  readonly step = input(undefined, { transform: optionalNumber });
  readonly precision = input(undefined, { transform: optionalNumber });
  readonly placeholder = input<string>();
  readonly label = input<string>();
  readonly message = input<string>();
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly decrementLabel = input<string>();
  readonly incrementLabel = input<string>();

  /** `null` is an emptied field, not an absent value. */
  private readonly current = computed(() => {
    const value = this.value();
    return value !== undefined ? value : (this.defaultValue() ?? null);
  });
  private readonly range = computed(() => ({ min: this.min(), max: this.max(), step: this.step(), precision: this.precision() }));

  protected readonly view = computed(() =>
    uiInputNumberView(
      {
        ...this.common(),
        ...this.range(),
        placeholder: this.placeholder(),
        label: this.label(),
        message: this.message(),
        invalid: this.invalid(),
        disabled: this.disabled() || this.formDisabled(),
        readOnly: this.readOnly(),
        name: this.name(),
        decrementLabel: this.decrementLabel(),
        incrementLabel: this.incrementLabel(),
      },
      this.resolved(),
      { value: this.current() },
    ),
  );

  protected committed(event: Event): void {
    const field = event.target as HTMLInputElement;
    const next = field.value.trim() === '' ? null : uiNumberValue(Number(field.value), this.range()).value;
    this.commit(next);
    // An unchanged value writes no attribute: the field shows the committed one all the same.
    field.value = next === null ? '' : String(next);
  }

  protected stepped(event: Event): void {
    const step = (event.currentTarget as Element | null)?.getAttribute('data-step');
    if (step) this.commit(uiNumberStep(this.current(), step === '1' ? 1 : -1, this.range()));
  }

  override writeValue(value: number | null): void {
    this.value.set(value);
  }
}
