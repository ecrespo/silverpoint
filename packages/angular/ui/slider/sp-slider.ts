import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, numberAttribute } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiSliderView } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/** `<sp-slider>`: a native range over the exact drawing; `[(value)]` or forms (DD-025, REQ-323). */
@Component({
  selector: 'sp-slider',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpSlider), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeInput)="commit($any($event.target).valueAsNumber)" />`,
})
export class SpSlider extends SpUiControl<number> {
  readonly value = model<number>();
  readonly defaultValue = input(undefined, { transform: optionalNumber });
  readonly label = input.required<string>();
  readonly min = input(undefined, { transform: optionalNumber });
  readonly max = input(undefined, { transform: optionalNumber });
  readonly step = input(undefined, { transform: optionalNumber });
  readonly name = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly marks = input<readonly number[]>();

  protected readonly view = computed(() =>
    uiSliderView(
      {
        ...this.common(),
        label: this.label(),
        min: this.min(),
        max: this.max(),
        step: this.step(),
        name: this.name(),
        disabled: this.disabled() || this.formDisabled(),
        marks: this.marks(),
      },
      this.resolved(),
      { value: this.value() ?? this.defaultValue() ?? this.min() ?? 0 },
    ),
  );
}
