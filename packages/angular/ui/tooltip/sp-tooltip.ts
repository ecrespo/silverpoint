import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, forwardRef, inject, input } from '@angular/core';
import { SpUiTree } from '@silverpoint/angular/ui/base';
import { SP_TRIGGER_OWNER, SpUiOverlay } from '@silverpoint/angular/ui/overlay';
import { uiTooltipView, type SpTooltipProps } from '@silverpoint/core/ui';

/** Time the pointer has to cross from the trigger onto the tooltip, ms (WCAG 1.4.13: hoverable). */
const GRACE = 100;

/**
 * `<sp-tooltip>`: a `manual` popover over its `spTrigger`, which it describes (REQ-492, REQ-496):
 * shown `delay` ms after hover or keyboard focus, kept while the pointer is on the tooltip itself,
 * hidden on blur, pointer leave or Escape.
 */
@Component({
  selector: 'sp-tooltip',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  providers: [{ provide: SP_TRIGGER_OWNER, useExisting: forwardRef(() => SpTooltip) }],
  template: `<ng-content select="[spTrigger]" /><sp-ui-tree [node]="view()" />`,
})
export class SpTooltip extends SpUiOverlay {
  protected override readonly triggerKind = 'tooltip' as const;
  readonly text = input.required<string>();
  readonly side = input<SpTooltipProps['side']>();
  readonly align = input<SpTooltipProps['align']>();
  readonly offset = input<number>();
  readonly delay = input<number>();

  protected readonly view = computed(() =>
    uiTooltipView({ ...this.common(), text: this.text(), side: this.side(), align: this.align(), offset: this.offset(), delay: this.delay() }, this.resolved(), { open: this.isOpen() }),
  );

  constructor() {
    super();
    const find = () => this.host.querySelector<HTMLElement>(':scope > sp-ui-tree > [popover]');
    this.native(find, () => 'popover', () => ({ place: { side: this.side() ?? 'top', align: this.align() ?? 'center', offset: this.offset() } }));

    let detach = () => {};
    afterNextRender(() => {
      const tooltip = find();
      const target = this.trigger()?.element;
      if (!tooltip || !target) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const later = (next: boolean, ms: number) => {
        clearTimeout(timer);
        timer = setTimeout(() => this.setOpen(next), ms);
      };
      const now = (next: boolean) => {
        clearTimeout(timer);
        this.setOpen(next);
      };
      const show = () => later(true, this.delay() ?? 300);
      const leave = () => later(false, GRACE);
      const stay = () => clearTimeout(timer);
      const hide = () => now(false);
      const escape = (event: Event) => (event as KeyboardEvent).key === 'Escape' && now(false);
      const on: [EventTarget, string, EventListener][] = [
        [target, 'pointerenter', show],
        [target, 'pointerleave', leave],
        [target, 'focus', show],
        [target, 'blur', hide],
        // Escape dismisses it wherever focus is, without moving the pointer (WCAG 1.4.13).
        [target.ownerDocument, 'keydown', escape],
        [tooltip, 'pointerenter', stay],
        [tooltip, 'pointerleave', leave],
      ];
      for (const [element, type, listener] of on) element.addEventListener(type, listener);
      detach = () => {
        clearTimeout(timer);
        for (const [element, type, listener] of on) element.removeEventListener(type, listener);
      };
    });
    inject(DestroyRef).onDestroy(() => detach());
  }
}
