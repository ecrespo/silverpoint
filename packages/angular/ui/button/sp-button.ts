import { isPlatformBrowser } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, PLATFORM_ID, Renderer2, type AfterViewInit } from '@angular/core';
import { SpUiBase, SpUiTree, syncUiAttrs } from '@silverpoint/angular/ui/base';
import { uiButtonView, uiRequireName, type UiAttrValue, type UiVariant } from '@silverpoint/core/ui';

/** Attributes the view may write on the host, removed when it does not (a disabled link loses `href`). */
const MANAGED = ['id', 'type', 'href', 'disabled', 'aria-disabled', 'aria-label', 'data-block'];

/**
 * `button[spButton]`, `a[spButton]` (DD-024): the consumer's own native element is the root, so a
 * `<form>` submits it and no host sits in the markup. The view's root attributes are written on it.
 */
@Component({
  selector: 'button[spButton], a[spButton]',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [rootless]="true" [slots]="{ content: content }" />`,
})
export class SpButton extends SpUiBase implements AfterViewInit {
  readonly variant = input<UiVariant>();
  readonly type = input<'button' | 'submit' | 'reset'>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly label = input<string>();
  readonly block = input(false, { transform: booleanAttribute });
  readonly href = input<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** A class written on the element by the consumer joins the core's. */
  private readonly consumerClass = this.host.getAttribute('class') ?? undefined;

  protected readonly view = computed(() =>
    uiButtonView(
      {
        ...this.common(),
        className: [this.className(), this.consumerClass].filter(Boolean).join(' ') || undefined,
        variant: this.variant(),
        type: this.type(),
        disabled: this.disabled(),
        label: this.label(),
        block: this.block(),
        href: this.href(),
      },
      this.resolved(),
      // The name is checked once the content is projected (ngAfterViewInit), not here.
      { text: '·' },
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
    // A disabled link is an `<a>` without `href`, which still takes clicks: none reaches the consumer (REQ-326).
    if (browser) {
      this.host.addEventListener(
        'click',
        (event) => {
          if (this.disabled()) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },
        { capture: true },
      );
    }
  }

  ngAfterViewInit(): void {
    uiRequireName('SpButton', this.host.textContent ?? undefined, this.label());
  }
}
