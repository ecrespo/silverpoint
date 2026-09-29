import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpKpiCard } from '@silverpoint/angular/kpi-card';
import { UI_PAGE, uiFixtureParts, uiSizeOf, type HarnessUiFixture, type HarnessUiPageItem } from '@silverpoint/example-harness';
import {
  SpAlert,
  SpBadge,
  SpButton,
  SpCard,
  SpCardExtra,
  SpCheckbox,
  SpDivider,
  SpInput,
  SpProgress,
  SpRadioGroup,
  SpRate,
  SpSegmented,
  SpSkeleton,
  SpSlider,
  SpSteps,
  SpSwitch,
  SpTabPanel,
  SpTabs,
  SpTag,
} from '@silverpoint/angular/ui';

/**
 * One component as an Angular consumer writes it: inputs bound one by one, the value as
 * `[defaultValue]`, `SpButton` on the page's own `<button>` (DD-024), the card's extra content as
 * an `spExtra` template. The pixel gate's fixtures and the UI page both use it.
 */
@Component({
  selector: 'app-ui-item',
  imports: [
    SpAlert,
    SpBadge,
    SpButton,
    SpCard,
    SpCardExtra,
    SpCheckbox,
    SpDivider,
    SpInput,
    SpProgress,
    SpRadioGroup,
    SpRate,
    SpSegmented,
    SpSkeleton,
    SpSlider,
    SpSteps,
    SpSwitch,
    SpTabPanel,
    SpTabs,
    SpTag,
    SpKpiCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @let p = parts().props;
      @switch (parts().component) {
        @case ('button') {
          <button spButton [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [variant]="p.variant" [disabled]="p.disabled ?? false">{{ parts().slots.content }}</button>
        }
        @case ('input') {
          <sp-input [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [placeholder]="p.placeholder" [type]="p.type" [name]="p.name" [invalid]="p.invalid ?? false" [message]="p.message" [disabled]="p.disabled ?? false" [defaultValue]="value()" />
        }
        @case ('checkbox') {
          <sp-checkbox [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [disabled]="p.disabled ?? false" [indeterminate]="p.indeterminate ?? false" [defaultValue]="value()" />
        }
        @case ('switch') {
          <sp-switch [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [disabled]="p.disabled ?? false" [defaultValue]="value()" />
        }
        @case ('card') {
          <sp-card [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [title]="p.title" [headingLevel]="p.headingLevel">
            @if (parts().slots.extra; as extra) {
              <ng-template spExtra>{{ extra }}</ng-template>
            }
            @if (parts().chart; as chart) {
              <sp-kpi-card [id]="chart.props['id']" [width]="chart.props['width']" [metric]="chart.props['metric']" [ground]="chart.props['ground']" [substrate]="chart.props['substrate']" [mode]="chart.props['mode']" />
            } @else {
              {{ parts().slots.content }}
            }
          </sp-card>
        }
        @case ('divider') {
          <sp-divider [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [text]="p.text" [orientation]="p.orientation" [align]="p.align" />
        }
        @case ('radio-group') {
          <sp-radio-group [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [items]="p.items" [orientation]="p.orientation" [defaultValue]="value()" />
        }
        @case ('segmented') {
          <sp-segmented [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [items]="p.items" [defaultValue]="value()" />
        }
        @case ('tabs') {
          <sp-tabs [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [items]="p.items" [defaultValue]="value()">
            @for (tab of parts().tabPanels ?? []; track tab.value) {
              <sp-tab-panel [value]="tab.value">{{ tab.text }}</sp-tab-panel>
            }
          </sp-tabs>
        }
        @case ('slider') {
          <sp-slider [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [marks]="p.marks" [disabled]="p.disabled ?? false" [defaultValue]="value()" />
        }
        @case ('rate') {
          <sp-rate [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [count]="p.count" [readOnly]="p.readOnly ?? false" [defaultValue]="value()" />
        }
        @case ('steps') {
          <sp-steps [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [items]="p.items" [current]="p.current" />
        }
        @case ('tag') {
          <sp-tag [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [tone]="p.tone" [closable]="p.closable ?? false">{{ parts().slots.content }}</sp-tag>
        }
        @case ('badge') {
          <sp-badge [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [count]="p.count" [dot]="p.dot ?? false" [max]="p.max">{{ parts().slots.content }}</sp-badge>
        }
        @case ('progress') {
          <sp-progress [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [value]="p.value" [shape]="p.shape" />
        }
        @case ('alert') {
          <sp-alert [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [kind]="p.kind" [title]="p.title">{{ parts().slots.content }}</sp-alert>
        }
        @case ('skeleton') {
          <sp-skeleton [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [lines]="p.lines" [avatar]="p.avatar ?? false" />
        }
      }
  `,
})
export class UiItemView {
  readonly item = input.required<Pick<HarnessUiPageItem, 'component' | 'props' | 'value' | 'slots' | 'chart' | 'tabPanels'>>();
  protected readonly parts = computed(() => this.item() as { component: string; props: Record<string, any>; value: any; slots: Record<string, string | undefined>; chart?: { props: Record<string, any> }; tabPanels?: readonly { value: string; text: string }[] });
  protected readonly value = computed(() => this.parts().value);
}

/** A UI fixture of the pixel gate (REQ-328), in its harness container. */
@Component({
  selector: 'app-ui-gate',
  imports: [UiItemView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @let f = fixture();
    <div [attr.class]="'sp-harness sp-ground-' + f.ground" data-gate="" data-ui="" [attr.data-substrate]="f.substrate" [attr.data-size]="size()">
      <app-ui-item [item]="item()" />
    </div>
  `,
})
export class UiGate {
  readonly fixture = input.required<HarnessUiFixture>();
  protected readonly item = computed(() => ({ component: this.fixture().component, ...uiFixtureParts(this.fixture()) }));
  protected readonly size = computed(() => uiSizeOf(this.fixture()));
}

/** The UI reference page (T-157): the 17 components in three panels, each a form. */
@Component({
  selector: 'app-ui-page',
  imports: [UiItemView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <h1>{{ page.title }} · Angular</h1>
    <div class="sp-ui-page">
      @for (panel of page.panels; track panel.key) {
        <form [attr.class]="'sp-ui-page-panel sp-ground-' + panel.ground" [attr.data-substrate]="panel.substrate" [attr.data-panel]="panel.key" [attr.aria-labelledby]="panel.key + '-title'">
          <h2 [id]="panel.key + '-title'">{{ panel.title }}</h2>
          <p class="sp-ui-page-note">{{ panel.note }}</p>
          <div class="sp-ui-page-sections">
            @for (section of panel.sections; track section.title) {
              <section class="sp-ui-page-section" [attr.aria-label]="section.title">
                <h3>{{ section.title }}</h3>
                <div class="sp-ui-page-items">
                  @for (item of section.items; track item.key) {
                    <app-ui-item [item]="item" />
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
export class UiPage {
  protected readonly page = UI_PAGE;
}
