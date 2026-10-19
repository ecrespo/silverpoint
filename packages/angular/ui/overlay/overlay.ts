import { afterNextRender, afterRenderEffect, booleanAttribute, computed, contentChild, DestroyRef, Directive, ElementRef, inject, InjectionToken, input, model, type Signal } from '@angular/core';
import { uiAnchor, uiOverlaySync, uiTriggerAria, type UiAnchorOptions, type UiOverlayKind, type UiTriggerKind } from '@silverpoint/core/ui';
import { SpUiBase } from '@silverpoint/angular/ui/base';

/** Absent stays `undefined`, so the core's default holds. */
export const optionalBoolean = (value: unknown): boolean | undefined => (value === undefined ? undefined : booleanAttribute(value));

/** The overlay a `spTrigger` belongs to. */
export interface SpTriggerOwner {
  /** The ARIA its APG pattern gives the trigger (REQ-500). */
  readonly triggerAria: Signal<Readonly<Record<string, string>>>;
  /** A press and a click on the trigger; absent when the overlay does not open from them. */
  triggerPressed?(): void;
  triggerClicked?(): void;
}

export const SP_TRIGGER_OWNER = new InjectionToken<SpTriggerOwner>('SP_TRIGGER_OWNER');

/**
 * `[spTrigger]`: the consumer's element that opens an overlay (REQ-500), projected into it. It takes
 * the ARIA of the overlay's pattern —on the server too— and, for a Modal, a Drawer or a Popover,
 * toggles it on click.
 */
@Directive({
  selector: '[spTrigger]',
  host: {
    '[attr.aria-haspopup]': "aria()['aria-haspopup'] ?? null",
    '[attr.aria-expanded]': "aria()['aria-expanded'] ?? null",
    '[attr.aria-controls]': "aria()['aria-controls'] ?? null",
    '[attr.aria-describedby]': "aria()['aria-describedby'] ?? null",
    '(pointerdown)': 'pressed()',
    '(click)': 'clicked()',
  },
})
export class SpTrigger {
  private readonly owner = inject(SP_TRIGGER_OWNER);
  /** @internal */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly aria = this.owner.triggerAria;

  protected pressed(): void {
    this.owner.triggerPressed?.();
  }
  protected clicked(): void {
    this.owner.triggerClicked?.();
  }
}

export interface OverlayOptions {
  /** Placement of an anchored overlay, from its trigger. */
  readonly place?: UiAnchorOptions;
  /** A dialog's Escape and backdrop click; default `true`. */
  readonly dismissible?: boolean;
}

/** The open state an overlay's native side reads and reports to. */
export interface OverlayState {
  readonly isOpen: Signal<boolean>;
  setOpen(next: boolean): void;
}

/**
 * The native side of an overlay (T-215, DD-038). After each render, opens or closes it as `open`
 * says (`uiOverlaySync`) and places an anchored one with `uiAnchor` while it is open —from `anchor`,
 * or the element before it—; after the first, reports a close the platform made: a dialog's `close`
 * (Escape, `close()`), a popover's `toggle` to `closed` (light dismiss). A dialog that is not
 * dismissible cancels Escape and ignores a click on its backdrop. Browser only; in an injection context.
 */
export function uiOverlayNative(
  state: OverlayState,
  find: () => HTMLElement | null,
  kind: () => UiOverlayKind,
  options: () => OverlayOptions = () => ({}),
  anchor: () => Element | null | undefined = () => undefined,
): void {
  afterRenderEffect((onCleanup) => {
    const overlay = find();
    if (!overlay) return;
    const open = state.isOpen();
    uiOverlaySync(overlay, kind(), open);
    const { place } = options();
    const at = anchor() ?? overlay.previousElementSibling;
    if (open && place && at) onCleanup(uiAnchor(at, overlay, place));
  });

  let detach = () => {};
  afterNextRender(() => {
    const overlay = find();
    if (!overlay) return;
    const closed = () => state.setOpen(false);
    if (kind() === 'popover') {
      const toggle = (event: Event) => (event as Event & { newState?: string }).newState === 'closed' && closed();
      overlay.addEventListener('toggle', toggle);
      detach = () => overlay.removeEventListener('toggle', toggle);
      return;
    }
    const cancel = (event: Event) => options().dismissible === false && event.preventDefault();
    // A click on the dialog element itself, not on its content, is a click on the backdrop.
    const backdrop = (event: Event) => event.target === overlay && options().dismissible !== false && (overlay as HTMLDialogElement).close();
    overlay.addEventListener('close', closed);
    overlay.addEventListener('cancel', cancel);
    overlay.addEventListener('click', backdrop);
    detach = () => {
      overlay.removeEventListener('close', closed);
      overlay.removeEventListener('cancel', cancel);
      overlay.removeEventListener('click', backdrop);
    };
  });
  inject(DestroyRef).onDestroy(() => detach());
}

/**
 * What every overlay shares (T-215, DD-038): `[(open)]` through `model()`, held from `defaultOpen`
 * otherwise; the ARIA of its `spTrigger`; and the native side, wired by `native()` from the
 * constructor.
 */
@Directive()
export abstract class SpUiOverlay extends SpUiBase implements SpTriggerOwner, OverlayState {
  readonly open = model<boolean>();
  readonly defaultOpen = input(undefined, { transform: optionalBoolean });

  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly trigger = contentChild(SpTrigger);
  /** The pattern its trigger follows; none for a toast. */
  protected readonly triggerKind?: UiTriggerKind;

  readonly isOpen = computed(() => this.open() ?? this.defaultOpen() ?? false);
  readonly triggerAria = computed(() => (this.triggerKind ? uiTriggerAria(this.triggerKind, this.id(), this.isOpen()) : {}));

  /** Reports a change only, never the state the overlay is already in. */
  setOpen(next: boolean): void {
    if (next !== this.isOpen()) this.open.set(next);
  }

  /** Wires the native side (`uiOverlayNative`); from the constructor. */
  protected native(find: () => HTMLElement | null, kind: () => UiOverlayKind, options: () => OverlayOptions = () => ({})): void {
    uiOverlayNative(this, find, kind, options, () => this.trigger()?.element);
  }
}

/**
 * An overlay its `spTrigger` toggles. A press on the trigger of an open popover closes it, even when
 * the press, outside the popover, already dismissed it.
 */
@Directive()
export abstract class SpUiToggledOverlay extends SpUiOverlay {
  private pressedOpen = false;

  triggerPressed(): void {
    this.pressedOpen = this.isOpen();
  }

  triggerClicked(): void {
    const wasOpen = this.pressedOpen || this.isOpen();
    this.pressedOpen = false;
    this.setOpen(!wasOpen);
  }
}
