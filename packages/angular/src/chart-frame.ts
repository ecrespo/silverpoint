import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { RenderedChart } from '@silverpoint/grounds';

/**
 * The chart's DOM — root, SVG, projected overlay and tabular alternative (API Spec §10). The
 * template writes the core's SVG view one field to one attribute and computes nothing (Art. 2).
 */
@Component({
  selector: 'sp-chart-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let r = rendered();
    @let v = r.view;
    <div
      [attr.class]="rootClass()"
      [attr.data-substrate]="r.substrate"
      [attr.data-chrome]="r.chrome"
      [attr.data-status]="r.status"
      [attr.tabindex]="interactive() ? 0 : null"
      [attr.role]="interactive() ? 'group' : null"
      [attr.aria-label]="interactive() ? r.name : null"
      (pointermove)="rootEvent.emit($event)"
      (pointerdown)="rootEvent.emit($event)"
      (click)="rootEvent.emit($event)"
      (pointerleave)="rootEvent.emit($event)"
      (focus)="rootEvent.emit($event)"
      (blur)="rootEvent.emit($event)"
      (keydown)="rootEvent.emit($event)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        [attr.viewBox]="v.svg.viewBox"
        [attr.width]="v.svg.width"
        [attr.height]="v.svg.height"
        [attr.class]="v.svg.class"
        [attr.data-substrate]="v.svg.substrate"
        [attr.data-mode]="v.svg.mode"
        [attr.role]="v.svg.role"
        [attr.aria-labelledby]="v.svg.labelledby"
      >
        <title [attr.id]="v.title.id">{{ v.title.text }}</title>
        <desc [attr.id]="v.desc.id">{{ v.desc.text }}</desc>
        @if (v.patterns.length > 0) {
          <defs>
            @for (pattern of v.patterns; track pattern.id) {
              <pattern
                [attr.id]="pattern.id"
                [attr.width]="pattern.width"
                [attr.height]="pattern.height"
                patternUnits="userSpaceOnUse"
                [attr.patternTransform]="pattern.transform"
              >
                @for (path of pattern.paths; track $index) {
                  <path
                    [attr.d]="path.d"
                    [attr.part]="path.part"
                    [attr.data-role]="path.role"
                    [attr.data-paint]="path.paint"
                    [attr.data-dash]="path.dash"
                    [attr.fill]="path.fill"
                  />
                }
              </pattern>
            }
          </defs>
        }
        @for (path of v.paths; track $index) {
          <path
            [attr.d]="path.d"
            [attr.part]="path.part"
            [attr.data-role]="path.role"
            [attr.data-paint]="path.paint"
            [attr.data-dash]="path.dash"
            [attr.fill]="path.fill"
          />
        }
        @for (text of v.texts; track $index) {
          <text
            [attr.x]="text.x"
            [attr.y]="text.y"
            [attr.part]="text.part"
            [attr.data-kind]="text.kind"
            [attr.text-anchor]="text.anchor"
          >{{ text.text }}</text>
        }
      </svg>
      <ng-content />
      @if (r.dataTable !== 'none') {
        <table class="sp-table" [attr.id]="r.ids.table" [attr.data-visibility]="r.dataTable">
          <caption>{{ r.table.caption }}</caption>
          <thead>
            <tr>
              @for (column of r.table.columns; track $index) {
                <th scope="col">{{ column }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of r.table.rows; track $index) {
              <tr>
                @for (cell of row; track $index; let first = $first) {
                  @if (first) {
                    <th scope="row">{{ cell }}</th>
                  } @else {
                    <td>{{ cell }}</td>
                  }
                }
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class SpChartFrame {
  readonly rendered = input.required<RenderedChart>();
  readonly rootClass = input.required<string>();
  /** Focusable, with the interaction events forwarded to the chart component. */
  readonly interactive = input(false);
  /** DOM events of the root, forwarded untouched; the chart turns them into core events. */
  readonly rootEvent = output<Event>();
}
