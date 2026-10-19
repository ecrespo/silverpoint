import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiTableView, type SpTableProps } from '@silverpoint/core/ui';

/** An optional boolean: absent stays `undefined`, so the core's default holds. */
const optional = (value: unknown): boolean | undefined => (value === undefined ? undefined : booleanAttribute(value));

/**
 * `<sp-table>`: a native table (REQ-473). A sortable header emits `(sort)` with its column's key; the
 * consumer sorts (`uiSortRows`) and sets `sortKey` / `sortOrder` (REQ-474).
 */
@Component({
  selector: 'sp-table',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" (clicked)="sorted($event)" />`,
})
export class SpTable extends SpUiBase {
  readonly columns = input.required<SpTableProps['columns']>();
  readonly data = input.required<SpTableProps['data']>();
  readonly caption = input<string>();
  readonly sortKey = input<string>();
  readonly sortOrder = input<SpTableProps['sortOrder']>();
  readonly striped = input(undefined, { transform: optional });
  readonly hoverable = input(undefined, { transform: optional });
  readonly bordered = input(undefined, { transform: optional });
  readonly emptyText = input<string>();
  readonly rowKey = input<string>();
  /** A sortable header was activated: its column's key. */
  readonly sort = output<string>();

  protected readonly view = computed(() =>
    uiTableView(
      {
        ...this.common(),
        columns: this.columns(),
        data: this.data(),
        caption: this.caption(),
        sortKey: this.sortKey(),
        sortOrder: this.sortOrder(),
        striped: this.striped(),
        hoverable: this.hoverable(),
        bordered: this.bordered(),
        emptyText: this.emptyText(),
        rowKey: this.rowKey(),
      },
      this.resolved(),
    ),
  );

  protected sorted(event: Event): void {
    const key = (event.currentTarget as Element | null)?.getAttribute('data-key');
    if (key != null) this.sort.emit(key);
  }
}
