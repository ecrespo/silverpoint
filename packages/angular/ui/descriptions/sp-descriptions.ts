import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiDescriptionsView, type SpDescriptionsProps } from '@silverpoint/core/ui';

/** `<sp-descriptions>`: a section named by its heading around a `<dl>` (REQ-480). */
@Component({
  selector: 'sp-descriptions',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpDescriptions extends SpUiBase {
  readonly items = input.required<SpDescriptionsProps['items']>();
  readonly title = input<string>();
  readonly columns = input<number>();
  /** Absent stays `undefined`, so the core's default (`true`) holds. */
  readonly bordered = input(undefined, { transform: (value: unknown) => (value === undefined ? undefined : booleanAttribute(value)) });
  readonly headingLevel = input<SpDescriptionsProps['headingLevel']>();

  protected readonly view = computed(() =>
    uiDescriptionsView(
      { ...this.common(), items: this.items(), title: this.title(), columns: this.columns(), bordered: this.bordered(), headingLevel: this.headingLevel() },
      this.resolved(),
    ),
  );
}
