import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpTreemapChart } from '@silverpoint/angular/treemap-chart';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-treemap-chart-view',
  imports: [SpTreemapChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-treemap-chart
      [data]="rows()"
      [labelKey]="'folder'"
      [shareKey]="'bytes'"
      [title]="'Treemap chart'"
    />
  `,
})
export class TreemapChartView {
  readonly rows = input.required<readonly Record<string, unknown>[]>();
}
