import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiStepsView, type StepItem, type UiOrientation } from '@silverpoint/core/ui';

/** `<sp-steps>`: an ordered list; the current step has `aria-current="step"` (REQ-318). */
@Component({
  selector: 'sp-steps',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpSteps extends SpUiBase {
  readonly items = input.required<readonly StepItem[]>();
  readonly current = input.required({ transform: numberAttribute });
  readonly orientation = input<UiOrientation>();
  readonly label = input<string>();

  protected readonly view = computed(() =>
    uiStepsView({ ...this.common(), items: this.items(), current: this.current(), orientation: this.orientation(), label: this.label() }, this.resolved()),
  );
}
