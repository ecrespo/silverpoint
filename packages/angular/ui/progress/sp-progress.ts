import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiProgressView, type SpProgressProps } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/** `<sp-progress>`: a `progressbar`; without `value`, indeterminate (REQ-318). */
@Component({
  selector: 'sp-progress',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpProgress extends SpUiBase {
  readonly value = input(undefined, { transform: optionalNumber });
  readonly shape = input<SpProgressProps['shape']>();
  readonly label = input.required<string>();
  readonly showValue = input(undefined, { transform: (v: unknown) => (v === undefined ? undefined : booleanAttribute(v)) });

  protected readonly view = computed(() =>
    uiProgressView({ ...this.common(), value: this.value(), shape: this.shape(), label: this.label(), showValue: this.showValue() }, this.resolved()),
  );
}
