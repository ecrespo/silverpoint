import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiTimelineListView, type SpTimelineListProps } from '@silverpoint/core/ui';

/** `<sp-timeline-list>`: an ordered list; each status by its mark's shape (REQ-481). */
@Component({
  selector: 'sp-timeline-list',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpTimelineList extends SpUiBase {
  readonly items = input.required<SpTimelineListProps['items']>();
  readonly label = input<string>();

  protected readonly view = computed(() => uiTimelineListView({ ...this.common(), items: this.items(), label: this.label() }, this.resolved()));
}
