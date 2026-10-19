import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, PLATFORM_ID, Renderer2 } from '@angular/core';
import { SpUiBase, SpUiTree, syncUiAttrs } from '@silverpoint/angular/ui/base';
import { uiSurfaceView, type SpSurfaceProps, type UiAttrValue } from '@silverpoint/core/ui';

/** Attributes the view may write on the host, removed when it does not. */
const MANAGED = ['id', 'style'];

/**
 * `[spSurface]` (REQ-472, DD-024): the consumer's own element is the root —it is what `as` names
 * elsewhere— and the view's root attributes are written on it; frame, tone and content inside.
 */
@Component({
  selector: '[spSurface]',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [rootless]="true" [slots]="{ content: content }" />`,
})
export class SpSurface extends SpUiBase {
  readonly name = input<string>();
  readonly frame = input<SpSurfaceProps['frame']>();
  readonly tone = input<SpSurfaceProps['tone']>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** A class written on the element by the consumer joins the core's. */
  private readonly consumerClass = this.host.getAttribute('class') ?? undefined;

  protected readonly view = computed(() =>
    uiSurfaceView(
      {
        ...this.common(),
        className: [this.className(), this.consumerClass].filter(Boolean).join(' ') || undefined,
        name: this.name(),
        frame: this.frame(),
        tone: this.tone(),
      },
      this.resolved(),
    ),
  );

  constructor() {
    super();
    const renderer = inject(Renderer2);
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    let previous: Readonly<Record<string, UiAttrValue>> = Object.fromEntries(MANAGED.map((name) => [name, '']));
    effect(() => {
      previous = syncUiAttrs(renderer, this.host, previous, this.view().attrs, browser);
    });
  }
}
