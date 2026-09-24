import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { DEMO_PROPS, fixtureById, fixtureProps } from '@silverpoint/example-harness';

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));

@Component({
  selector: 'app-root',
  imports: [SpLineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (gate; as p) {
      <main>
        <div class="sp-harness" data-gate="" data-size="md">
          <sp-line-chart
            [id]="p.id" [width]="p.width" [height]="p.height" [ground]="p.ground" [substrate]="p.substrate"
            [mode]="p.mode" [hatchFill]="p.hatchFill" [seed]="p.seed" [title]="p.title" [badge]="p.badge"
            [value]="p.value" [unit]="p.unit" [footerLeft]="p.footerLeft" [footerRight]="p.footerRight"
          />
        </div>
      </main>
    } @else {
      <main>
        <h1>silverpoint · Angular</h1>
        <div class="sp-harness" data-size="md">
          <sp-line-chart
            [id]="demo.id" [width]="demo.width" [title]="demo.title" [badge]="demo.badge" [value]="demo.value"
            [unit]="demo.unit" [footerLeft]="demo.footerLeft" [footerRight]="demo.footerRight"
          />
        </div>
      </main>
    }
  `,
})
class App {
  protected readonly gate = fixture ? fixtureProps(fixture) : undefined;
  protected readonly demo = DEMO_PROPS;
}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }).catch((error: unknown) => console.error(error));
