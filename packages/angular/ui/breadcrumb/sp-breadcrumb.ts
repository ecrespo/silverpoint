import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiBreadcrumbView, type SpBreadcrumbProps } from '@silverpoint/core/ui';

/** `<sp-breadcrumb>`: a labelled nav; the last item is the current page (REQ-477). */
@Component({
  selector: 'sp-breadcrumb',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpBreadcrumb extends SpUiBase {
  readonly items = input.required<SpBreadcrumbProps['items']>();
  readonly label = input<string>();

  protected readonly view = computed(() => uiBreadcrumbView({ ...this.common(), items: this.items(), label: this.label() }, this.resolved()));
}
