import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpSankeyChart } from '@silverpoint/angular/sankey-chart';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-sankey-chart-view',
  imports: [SpSankeyChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-sankey-chart
      [data]="rows()"
      [sourceKey]="'from'"
      [targetKey]="'to'"
      [valueKey]="'count'"
      [title]="'Signup flow'"
      [height]="240"
      [ground]="'cyanotype'"
    />
  `,
})
export class SankeyChartView {
  readonly rows = input.required<readonly Record<string, unknown>[]>();
}
