import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, numberAttribute } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiTextareaView } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/** `<sp-textarea>`: a native `<textarea>` on the `SpInput` contract; `[(value)]` or forms (REQ-484, REQ-488). */
@Component({
  selector: 'sp-textarea',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpTextarea), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeInput)="commit($any($event.target).value)" />`,
})
export class SpTextarea extends SpUiControl<string> {
  readonly value = model<string>();
  readonly defaultValue = input<string>();
  readonly rows = input(undefined, { transform: optionalNumber });
  readonly placeholder = input<string>();
  readonly label = input<string>();
  readonly message = input<string>();
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly maxLength = input(undefined, { transform: optionalNumber });
  readonly showCount = input(false, { transform: booleanAttribute });
  readonly name = input<string>();

  protected readonly view = computed(() =>
    uiTextareaView(
      {
        ...this.common(),
        rows: this.rows(),
        placeholder: this.placeholder(),
        label: this.label(),
        message: this.message(),
        invalid: this.invalid(),
        disabled: this.disabled() || this.formDisabled(),
        readOnly: this.readOnly(),
        maxLength: this.maxLength(),
        showCount: this.showCount(),
        name: this.name(),
      },
      this.resolved(),
      { value: this.value() ?? this.defaultValue() ?? '' },
    ),
  );
}
