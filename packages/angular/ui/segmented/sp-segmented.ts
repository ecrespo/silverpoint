import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiSegmentedView, type UiItem } from '@silverpoint/core/ui';

/** `<sp-segmented>`: native radios in one frame; `[(value)]` or forms; arrows through the core (REQ-315). */
@Component({
  selector: 'sp-segmented',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '(keydown)': "rove($event, 'input.sp-ui-native', 'both', true)" },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpSegmented), multi: true }],
  template: `<sp-ui-tree [node]="view()" (nativeChange)="commit($any($event.target).value)" />`,
})
export class SpSegmented extends SpUiControl<string> {
  readonly value = model<string>();
  readonly defaultValue = input<string>();
  readonly items = input.required<readonly UiItem[]>();
  readonly label = input.required<string>();
  readonly name = input<string>();
  readonly block = input(false, { transform: booleanAttribute });

  protected readonly view = computed(() => {
    const disabled = this.formDisabled();
    return uiSegmentedView(
      {
        ...this.common(),
        items: disabled ? this.items().map((item) => ({ ...item, disabled: true })) : this.items(),
        label: this.label(),
        name: this.name(),
        block: this.block(),
      },
      this.resolved(),
      { value: this.value() ?? this.defaultValue() ?? null },
    );
  });
}
