import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { sanguine } from '@silverpoint/core/palettes';
import { SpStreamChart } from '@silverpoint/angular/stream-chart';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-stream-chart-view',
  imports: [SpStreamChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-stream-chart
      [data]="rows()"
      [xKey]="'day'"
      [keys]="['hits', 'misses']"
      [title]="'Stream chart'"
      [mode]="'precision'"
      [palette]="sanguine"
    />
  `,
})
export class StreamChartView {
  readonly rows = input.required<readonly Record<string, unknown>[]>();
  protected readonly sanguine = sanguine;
}
