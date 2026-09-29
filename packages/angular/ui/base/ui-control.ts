import { Directive, ElementRef, inject, signal, type ModelSignal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { uiRovingFocus, type UiOrientation } from '@silverpoint/core/ui';
import { SpUiBase } from './ui-base';

/**
 * A value component (REQ-322, REQ-323): `[(value)]` through `model()`, or any forms directive
 * through ControlValueAccessor. The subclass declares `value` and provides NG_VALUE_ACCESSOR.
 */
@Directive()
export abstract class SpUiControl<T> extends SpUiBase implements ControlValueAccessor {
  abstract readonly value: ModelSignal<T | undefined>;

  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Set by a forms directive; joins the `disabled` input. */
  protected readonly formDisabled = signal(false);
  private notify: (value: T) => void = () => {};
  private touched: () => void = () => {};

  /** A value the user chose: the model, then the form. */
  protected commit(next: T): void {
    this.value.set(next);
    this.notify(next);
    this.touched();
  }

  /** The keyboard of a composite, through the core (REQ-315): bound to the host's `keydown`. */
  protected rove(event: KeyboardEvent, selector: string, orientation: UiOrientation | 'both', activate: boolean): void {
    // The `.sp-ui` root, not the host: a `dir` set on the root is the nearest one (REQ-321).
    uiRovingFocus(event, this.host.querySelector<HTMLElement>('.sp-ui') ?? this.host, selector, orientation, activate);
  }

  writeValue(value: T | null): void {
    this.value.set(value ?? undefined);
  }
  registerOnChange(fn: (value: T) => void): void {
    this.notify = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
