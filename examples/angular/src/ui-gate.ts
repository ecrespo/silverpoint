import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { uiFixtureParts, uiSizeOf, type HarnessUiFixture } from '@silverpoint/example-harness';
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
  SpTabs,
  SpTag,
} from '@silverpoint/angular/ui';

/**
 * A UI fixture of the pixel gate as an Angular consumer writes it (REQ-328): inputs bound one by
 * one, the value by `[value]`, `SpButton` on the page's own `<button>` (DD-024), the card's extra
 * content as an `spExtra` template.
 */
@Component({
  selector: 'app-ui-gate',
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
    SpTabs,
    SpTag,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @let f = fixture();
    @let p = parts().props;
    <div [attr.class]="'sp-harness sp-ground-' + f.ground" data-gate="" data-ui="" [attr.data-substrate]="f.substrate" [attr.data-size]="size()">
      @switch (f.component) {
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
          <sp-card [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [title]="p.title">
            @if (parts().slots.extra; as extra) {
              <ng-template spExtra>{{ extra }}</ng-template>
            }
            {{ parts().slots.content }}
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
          <sp-tabs [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [items]="p.items" [defaultValue]="value()" />
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
    </div>
  `,
})
export class UiGate {
  readonly fixture = input.required<HarnessUiFixture>();
  protected readonly parts = computed(() => uiFixtureParts(this.fixture()) as { props: Record<string, any>; value: any; slots: Record<string, string | undefined> });
  protected readonly value = computed(() => this.parts().value);
  protected readonly size = computed(() => uiSizeOf(this.fixture()));
}
