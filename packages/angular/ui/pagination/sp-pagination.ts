import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model, numberAttribute } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiPaginationView } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/** `<sp-pagination>`: a labelled nav of page buttons, with `[(current)]` (REQ-476, REQ-322). */
@Component({
  selector: 'sp-pagination',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" (clicked)="chose($event)" />`,
})
export class SpPagination extends SpUiBase {
  /** The page, 1-based. */
  readonly current = model<number>();
  readonly defaultCurrent = input(undefined, { transform: optionalNumber });
  readonly total = input.required({ transform: numberAttribute });
  readonly pageSize = input(undefined, { transform: optionalNumber });
  readonly siblings = input(undefined, { transform: optionalNumber });
  readonly showTotal = input(false, { transform: booleanAttribute });
  readonly totalTemplate = input<string>();
  readonly label = input<string>();
  readonly previousLabel = input<string>();
  readonly nextLabel = input<string>();
  readonly pageLabel = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly view = computed(() =>
    uiPaginationView(
      {
        ...this.common(),
        total: this.total(),
        pageSize: this.pageSize(),
        siblings: this.siblings(),
        showTotal: this.showTotal(),
        totalTemplate: this.totalTemplate(),
        label: this.label(),
        previousLabel: this.previousLabel(),
        nextLabel: this.nextLabel(),
        pageLabel: this.pageLabel(),
        disabled: this.disabled(),
      },
      this.resolved(),
      { current: this.current() ?? this.defaultCurrent() ?? 1 },
    ),
  );

  protected chose(event: Event): void {
    const page = (event.currentTarget as Element | null)?.getAttribute('data-page');
    if (page != null) this.current.set(Number(page));
  }
}
