import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, numberAttribute } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiRateView } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/** `<sp-rate>`: native radios valued 1..count; `[(value)]` or forms; read-only takes no click and no key (REQ-326). */
@Component({
  selector: 'sp-rate',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '(keydown)': "readOnly() || rove($event, 'input.sp-ui-native', 'both', true)" },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpRate), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeClick)="readOnly() && $event.preventDefault()" (nativeChange)="readOnly() || commit(+$any($event.target).value)" />`,
})
export class SpRate extends SpUiControl<number> {
  readonly value = model<number>();
  readonly defaultValue = input(undefined, { transform: optionalNumber });
  readonly label = input.required<string>();
  readonly count = input(undefined, { transform: optionalNumber });
  readonly name = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  protected readonly view = computed(() =>
    uiRateView(
      {
        ...this.common(),
        label: this.label(),
        count: this.count(),
        name: this.name(),
        disabled: this.disabled() || this.formDisabled(),
        readOnly: this.readOnly(),
      },
      this.resolved(),
      { value: this.value() ?? this.defaultValue() ?? 0 },
    ),
  );
}
