import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiRadioGroupView, type UiItem, type UiOrientation } from '@silverpoint/core/ui';

/** `<sp-radio-group>`: a `<fieldset>` of native radios; `[(value)]` or forms; arrows through the core (REQ-315). */
@Component({
  selector: 'sp-radio-group',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '(keydown)': "rove($event, 'input.sp-ui-native', 'both', true)" },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpRadioGroup), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeChange)="commit($any($event.target).value)" />`,
})
export class SpRadioGroup extends SpUiControl<string | null> {
  readonly value = model<string | null>();
  readonly defaultValue = input<string | null>();
  readonly items = input.required<readonly UiItem[]>();
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly orientation = input<UiOrientation>();

  protected readonly view = computed(() => {
    const disabled = this.formDisabled();
    return uiRadioGroupView(
      {
        ...this.common(),
        items: disabled ? this.items().map((item) => ({ ...item, disabled: true })) : this.items(),
        name: this.name(),
        label: this.label(),
        orientation: this.orientation(),
      },
      this.resolved(),
      { value: this.value() ?? this.defaultValue() ?? null },
    );
  });
}
