import {
  afterRenderEffect,
  ApplicationRef,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  createComponent,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  input,
  numberAttribute,
  output,
  reflectComponentType,
  Renderer2,
  signal,
  untracked,
  type ComponentRef,
  type OnChanges,
  type OnInit,
} from '@angular/core';
import type { ProviderConfig } from '@silverpoint/core';
import type { UiAttrValue } from '@silverpoint/core/ui';
import { SILVERPOINT_CONFIG, SilverpointIds } from '@silverpoint/angular/env';
import { SpUiAttrs, SpUiTree } from '@silverpoint/angular/ui/base';
import {
  createDeckController,
  createDeckEngine,
  deckView,
  hydrationPlan,
  sanitiseDeckId,
  type DeckController,
  type DeckEvents,
  type DeckMode,
  type DeckSize,
  type DeckState,
  type ViewAttrs,
} from '@silverpoint/marp';
import { attachDeck, fullscreenAvailable } from '@silverpoint/marp/client';
import { CHART_LOADERS } from './chart-loaders';

/**
 * `[spDeckHtml]`: a slide box's content, the engine's own output (Markdown HTML is off and not
 * configurable, REQ-572, REQ-575). Written through the renderer: Angular's `[innerHTML]` would
 * sanitise the SVG away.
 */
@Directive({ selector: '[spDeckHtml]' })
export class SpDeckHtml implements OnChanges {
  readonly spDeckHtml = input.required<string>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  // Called only when the string changes: a page move leaves the slide's DOM, and its charts, alone.
  ngOnChanges(): void {
    this.renderer.setProperty(this.element, 'innerHTML', this.spDeckHtml());
  }
}

/**
 * `[spDeckStyle]`: the deck's scoped `<style>` (templates drop `<style>`), as the root's *last* child.
 * It is not a template node, so it must not sit before one: hydration walks the server's nodes in the
 * template's order, and a leading extra node would shift every one after it. Directives run after
 * the root's own children exist, so appending places it last, on the server as on the client.
 */
@Directive({ selector: '[spDeckStyle]' })
export class SpDeckStyle implements OnChanges {
  readonly spDeckStyle = input.required<string>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private style: unknown;

  ngOnChanges(): void {
    if (!this.style) {
      // A server-rendered deck already has it: reuse it rather than add a second.
      const last = this.element.lastElementChild;
      this.style = last?.tagName === 'STYLE' ? last : this.renderer.createElement('style');
      if (this.style !== last) this.renderer.appendChild(this.element, this.style);
    }
    this.renderer.setProperty(this.style, 'textContent', this.spDeckStyle());
  }
}

type Attrs = Readonly<Record<string, UiAttrValue>>;

/** The view's attributes as `[spUiAttrs]` takes them: an absent one is left out. */
function defined(attrs: ViewAttrs): Attrs {
  const out: Record<string, UiAttrValue> = {};
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined) out[name] = value;
  return out;
}

const groundName = (ground: ProviderConfig['ground']) => (typeof ground === 'string' ? ground : ground?.name);

/**
 * `<sp-deck>` (T-275, REQ-608, REQ-610..REQ-612, API delta §6): a Marp/Marpit Markdown deck in the
 * ground's hand. The markup is `deckView`'s (Art. 2, Art. 3); this binds it: the controller's state
 * in a signal, the client half after render (`attachDeck`), and each fence chart created with
 * `createComponent` on a host of its own selector inside the slot, in place of its static SVG.
 *
 * `pageChange` carries `{ page, total }` as in React and Vue (REQ-606), so two-way binding reads
 * `[page]="page" (pageChange)="page = $event.page"`.
 */
@Component({
  selector: 'sp-deck',
  imports: [SpUiAttrs, SpUiTree, SpDeckHtml, SpDeckStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template:
    `@let v = view();` +
    `<div [spUiAttrs]="v.root" [spDeckStyle]="v.css">` +
    `<div [spUiAttrs]="v.viewport"><div [spUiAttrs]="v.container">` +
    `@for (slide of v.slides; track slide.key) {<div [spUiAttrs]="slide.attrs" [spDeckHtml]="slide.html"></div>}` +
    `</div></div>` +
    `@if (v.notes; as notes) {<aside [spUiAttrs]="notes.attrs">@for (text of notes.paragraphs; track $index) {<p>{{ text }}</p>}</aside>}` +
    `@if (v.controls; as controls) {<sp-ui-tree [node]="controls" />}` +
    `<p [spUiAttrs]="v.status.attrs">{{ v.status.text }}</p>` +
    `</div>`,
})
export class SpDeckComponent implements OnInit {
  readonly markdown = input.required<string>();
  readonly page = input<number | undefined, unknown>(undefined, { transform: (v: unknown) => (v === undefined || v === null || v === '' ? undefined : numberAttribute(v)) });
  readonly defaultPage = input<number | undefined, unknown>(undefined, { transform: (v: unknown) => (v === undefined || v === null || v === '' ? undefined : numberAttribute(v)) });
  readonly id = input<string>();
  readonly label = input<string>();
  readonly theme = input<string>();
  readonly ground = input<string>();
  readonly substrate = input<string>();
  readonly mode = input<DeckMode>();
  readonly palette = input<string>();
  readonly size = input<DeckSize>();
  readonly showNotes = input(false, { transform: booleanAttribute });
  readonly showControls = input(true, { transform: booleanAttribute });
  readonly keyboard = input(true, { transform: booleanAttribute });
  readonly swipe = input(true, { transform: booleanAttribute });
  readonly hash = input(false, { transform: booleanAttribute });
  readonly interactive = input(true, { transform: booleanAttribute });

  readonly pageChange = output<DeckEvents['pageChange']>();
  readonly fragmentChange = output<DeckEvents['fragmentChange']>();
  readonly ready = output<DeckEvents['ready']>();

  private readonly provider = inject(SILVERPOINT_CONFIG, { optional: true }) ?? {};
  private readonly generated = inject(SilverpointIds).next();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly appRef = inject(ApplicationRef);
  private readonly environment = inject(EnvironmentInjector);

  private controller: DeckController | undefined;
  private readonly state = signal<DeckState | undefined>(undefined);
  // Known after render only, so the server and the first client render agree (REQ-603, REQ-612).
  private readonly canFullscreen = signal(false);

  private readonly resolved = computed(() => {
    const ground = this.ground() ?? groundName(this.provider.ground) ?? 'silverpoint';
    const substrate = this.substrate() ?? (this.ground() === undefined ? (this.provider.substrate as string | undefined) : undefined);
    return { ground, substrate, mode: this.mode() ?? this.provider.mode ?? 'ink', palette: this.palette() ?? this.provider.palette, locale: this.provider.locale };
  });

  protected readonly render = computed(() => {
    const r = this.resolved();
    const theme = this.theme();
    const size = this.size();
    return createDeckEngine({
      id: sanitiseDeckId(this.id() ?? `sp-deck-${this.generated}`),
      ground: r.ground,
      ...(r.substrate === undefined ? {} : { substrate: r.substrate }),
      mode: r.mode,
      ...(theme === undefined ? {} : { theme }),
      ...(size === undefined ? {} : { size }),
      ...(r.locale === undefined ? {} : { locale: r.locale }),
      ...(r.palette === undefined ? {} : { palette: r.palette }),
    }).render(this.markdown());
  });

  protected readonly view = computed(() => {
    const render = this.render();
    const state = this.state() ?? { page: 1, step: 0, overview: false, notes: false, fullscreen: false };
    const r = this.resolved();
    const label = this.label();
    const view = deckView(render, state, {
      ...(label === undefined ? {} : { label }),
      showControls: this.showControls(),
      fullscreenAvailable: this.canFullscreen(),
      ground: r.ground,
      ...(r.substrate === undefined ? {} : { substrate: r.substrate }),
      mode: r.mode,
    });
    return {
      root: defined(view.root),
      viewport: defined(view.viewport),
      container: defined(view.container),
      slides: view.slides.map((slide) => ({ key: slide.key, html: slide.html, attrs: defined(slide.attrs) })),
      notes: view.notes && { attrs: defined(view.notes.attrs), paragraphs: view.notes.paragraphs },
      controls: view.controls,
      status: { attrs: defined(view.status.attrs), text: view.status.text },
      css: view.css,
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.controller?.destroy());

    effect(() => {
      const render = this.render();
      untracked(() => this.controller?.setTotal(render.total, render.slides.map((s) => s.fragments)));
    });
    effect(() => {
      const page = this.page();
      if (page !== undefined) untracked(() => this.controller?.setControlledPage(page));
    });
    effect(() => {
      const show = this.showNotes();
      untracked(() => this.controller?.toggleNotes(show));
    });

    // Browser only, after render; redone for new Markdown or new options (REQ-610).
    afterRenderEffect((onCleanup) => {
      const render = this.render();
      const options = { keyboard: this.keyboard(), swipe: this.swipe(), hash: this.hash() };
      const interactive = this.interactive();
      const palette = this.resolved().palette;
      const controller = this.controller;
      const root = this.host.querySelector<HTMLElement>(':scope > .sp-deck');
      if (!root || !controller) return;
      untracked(() => this.canFullscreen.set(fullscreenAvailable(root)));
      onCleanup(
        untracked(() =>
          attachDeck(root, controller, options, {
            plan: interactive ? hydrationPlan(render, palette) : [],
            mountChart: (slot, entry) => {
              let live = true;
              let ref: ComponentRef<unknown> | undefined;
              const load = CHART_LOADERS[entry.chart];
              if (load) {
                void load().then((Chart) => {
                  if (!live) return;
                  // The framework chart replaces the static one: the same tree, now interactive (Art. 3).
                  const element = document.createElement(reflectComponentType(Chart)?.selector ?? 'div');
                  slot.replaceChildren(element);
                  slot.setAttribute('data-sp-hydrated', '');
                  ref = createComponent(Chart, { environmentInjector: this.environment, hostElement: element });
                  for (const [name, value] of Object.entries(entry.props)) ref.setInput(name, value);
                  this.appRef.attachView(ref.hostView);
                  ref.changeDetectorRef.detectChanges();
                });
              }
              return () => {
                live = false;
                if (!ref) return;
                this.appRef.detachView(ref.hostView);
                ref.destroy();
              };
            },
          }),
        ),
      );
    });
  }

  ngOnInit(): void {
    const render = this.render();
    const page = this.page();
    const defaultPage = this.defaultPage();
    const controller = createDeckController({
      total: render.total,
      steps: render.slides.map((s) => s.fragments),
      ...(page === undefined ? (defaultPage === undefined ? {} : { defaultPage }) : { page }),
    });
    this.controller = controller;
    this.state.set(controller.state);
    controller.on('state', (s) => this.state.set(s));
    controller.on('pageChange', (p) => this.pageChange.emit(p));
    controller.on('fragmentChange', (p) => this.fragmentChange.emit(p));
    controller.on('ready', (p) => this.ready.emit(p));
  }
}
