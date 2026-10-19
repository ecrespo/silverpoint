import { afterNextRender, afterRenderEffect, ChangeDetectionStrategy, Component, computed, contentChild, DestroyRef, Directive, ElementRef, inject, input, TemplateRef } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { SpUiOverlay } from '@silverpoint/angular/ui/overlay';
import { uiToastDuration, uiToasterView, uiToastView, type AlertKind, type SpToasterProps } from '@silverpoint/core/ui';

/** `<ng-template spAction>`: a toast's action, beside its text. */
@Directive({ selector: 'ng-template[spAction]' })
export class SpToastAction {
  readonly template = inject(TemplateRef);
}

/** `<sp-toaster>`: the labelled region of its toasts, which take its `duration` (REQ-497); F8 moves focus to it. */
@Component({
  selector: 'sp-toaster',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" />`,
})
export class SpToaster extends SpUiBase {
  readonly position = input<SpToasterProps['position']>();
  readonly duration = input<number>();
  readonly label = input<string>();

  protected readonly view = computed(() => uiToasterView({ ...this.common(), position: this.position(), duration: this.duration(), label: this.label() }, this.resolved()));

  constructor() {
    super();
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const f8 = (event: KeyboardEvent) => {
      const region = host.querySelector<HTMLElement>(':scope > sp-ui-tree > section');
      if (event.key !== 'F8' || !region) return;
      // Focusable once asked, never in the server markup.
      region.setAttribute('tabindex', '-1');
      region.focus();
    };
    afterNextRender(() => document.addEventListener('keydown', f8));
    inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', f8));
  }
}

/**
 * `<sp-toast>`: announced by its kind, with `[(open)]` and an `<ng-template spAction>` (REQ-497); it
 * closes after its duration —its own, its toaster's or 5000 ms, by `uiToastDuration`— counted again
 * from the start once the pointer and focus have left it.
 */
@Component({
  selector: 'sp-toast',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" [slots]="{ action: action()?.template }" (clicked)="setOpen(false)" />`,
})
export class SpToast extends SpUiOverlay {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly kind = input<AlertKind>();
  readonly duration = input<number>();
  readonly closeLabel = input<string>();

  protected readonly action = contentChild(SpToastAction);
  private readonly toaster = inject(SpToaster, { optional: true });
  private readonly ms = computed(() => uiToastDuration(this.duration(), this.toaster?.duration()));

  protected readonly view = computed(() =>
    uiToastView(
      { ...this.common(), title: this.title(), description: this.description(), kind: this.kind(), duration: this.duration(), closeLabel: this.closeLabel() },
      this.resolved(),
      { open: this.isOpen() },
      { action: !!this.action() },
    ),
  );

  constructor() {
    super();
    afterRenderEffect((onCleanup) => {
      const toast = this.host.querySelector<HTMLElement>(':scope > sp-ui-tree > li');
      const ms = this.ms();
      if (!toast || !this.isOpen() || ms === Infinity) return;
      // A pause restarts the whole duration when it ends: no clock is read (Art. 4).
      let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => this.setOpen(false), ms);
      const pause = () => {
        clearTimeout(timer);
        timer = undefined;
      };
      const resume = () => {
        if (timer !== undefined || toast.contains(toast.ownerDocument.activeElement)) return;
        timer = setTimeout(() => this.setOpen(false), ms);
      };
      const on: [string, EventListener][] = [
        ['pointerenter', pause],
        ['focusin', pause],
        ['pointerleave', resume],
        ['focusout', resume],
      ];
      for (const [type, listener] of on) toast.addEventListener(type, listener);
      onCleanup(() => {
        clearTimeout(timer);
        for (const [type, listener] of on) toast.removeEventListener(type, listener);
      });
    });
  }
}
