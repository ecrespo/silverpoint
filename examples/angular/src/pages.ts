import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMPOSED_PAGE, PALETTES_PAGE, TIMELINE_PAGE } from '@silverpoint/example-harness';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { SpTimeline, SpTimelineFallback } from '@silverpoint/angular/timeline';
import { SpCard, SpProgress, SpTable, SpToaster } from '@silverpoint/angular/ui';
import { UiComposedView } from './ui-composed';

/** The composed page (T-222): the 21 new rows, every state, in the UI page's three panels. */
@Component({
  selector: 'app-composed-page',
  imports: [SpToaster, UiComposedView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <h1>{{ page.title }} · Angular</h1>
    <div class="sp-ui-page sp-composed-page">
      @for (panel of page.panels; track panel.key) {
        <form [attr.class]="'sp-ui-page-panel sp-ground-' + panel.ground" [attr.data-substrate]="panel.substrate" [attr.data-panel]="panel.key" [attr.aria-labelledby]="panel.key + '-title'">
          <h2 [id]="panel.key + '-title'">{{ panel.title }}</h2>
          <p class="sp-ui-page-note">{{ panel.note }}</p>
          <div class="sp-ui-page-sections">
            @for (section of panel.sections; track section.title) {
              <section class="sp-ui-page-section" [attr.aria-label]="section.title">
                <h3>{{ section.title }}</h3>
                <div class="sp-ui-page-items">
                  @for (item of section.items; track item.id) {
                    @if (!section.toaster || item.component !== 'toast') {
                      <div class="sp-page-item" [attr.data-wide]="item.width === 640 ? '' : null">
                        <app-ui-composed [fixture]="item" />
                      </div>
                    }
                  }
                  @if (section.toaster; as toaster) {
                    <sp-toaster [id]="toaster.id" [label]="toaster.label" [ground]="toaster.ground" [substrate]="toaster.substrate" [mode]="toaster.mode">
                      @for (item of section.items; track item.id) {
                        @if (item.component === 'toast') {
                          <app-ui-composed [fixture]="item" />
                        }
                      }
                    </sp-toaster>
                  }
                </div>
              </section>
            }
          </div>
        </form>
      }
    </div>
  `,
})
export class ComposedPage {
  protected readonly page = COMPOSED_PAGE;
}

/** The palettes page (T-222): each preset over a LineChart, a Card holding a Progress, and a Table. */
@Component({
  selector: 'app-palettes-page',
  imports: [NgComponentOutlet, SpCard, SpProgress, SpTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <h1>{{ page.title }} · Angular</h1>
    <div class="sp-palettes-page">
      @for (preset of page.presets; track preset.key) {
        @let card = preset.card;
        @let progress = preset.progress;
        @let table = preset.table;
        <section class="sp-palette-preset sp-ground-silverpoint" data-substrate="cream" [attr.data-preset]="preset.key" [attr.aria-labelledby]="preset.key + '-title'">
          <h2 [id]="preset.key + '-title'">{{ preset.title }}</h2>
          <ng-container *ngComponentOutlet="lineChart; inputs: chartInputs[$index]" />
          <sp-card [id]="card.id" [ground]="card.ground" [substrate]="card.substrate" [mode]="card.mode" [palette]="card.palette" [title]="card.title" [headingLevel]="card.headingLevel">
            <sp-progress [id]="progress.id" [ground]="progress.ground" [substrate]="progress.substrate" [mode]="progress.mode" [palette]="progress.palette" [label]="progress.label" [value]="progress.value" [shape]="progress.shape" />
          </sp-card>
          <sp-table [id]="table.id" [ground]="table.ground" [substrate]="table.substrate" [mode]="table.mode" [palette]="table.palette" [caption]="table.caption" [columns]="table.columns" [data]="table.data" [rowKey]="table.rowKey" />
        </section>
      }
    </div>
  `,
})
export class PalettesPage {
  protected readonly page = PALETTES_PAGE;
  protected readonly lineChart = SpLineChart;
  /** The LineCharts' props, as `ngComponentOutlet` takes inputs. */
  protected readonly chartInputs = PALETTES_PAGE.presets.map((preset) => ({ ...preset.chart }) as Record<string, unknown>);
}

/** The timeline page (T-222): the surface is server-rendered; TimelineJS is imported and built after render. */
@Component({
  selector: 'app-timeline-page',
  imports: [SpTimeline, SpTimelineFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @let t = page.timeline;
    <h1>{{ page.title }} · Angular</h1>
    <div class="sp-timeline-page sp-ground-silverpoint" data-substrate="cream">
      <sp-timeline [id]="t.id" [data]="t.data" [ground]="t.ground" [substrate]="t.substrate" [mode]="t.mode">
        <ng-template spFallback><p>{{ page.fallback }}</p></ng-template>
      </sp-timeline>
    </div>
  `,
})
export class TimelinePage {
  protected readonly page = TIMELINE_PAGE;
}
