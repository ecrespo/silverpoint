import type { ProviderConfig } from '@silverpoint/core';
import { createDeckController, createDeckEngine, deckView, hydrationPlan, sanitiseDeckId, type DeckController, type DeckEvents, type DeckMode, type DeckSize, type ViewAttrs } from '@silverpoint/marp';
import { attachDeck, fullscreenAvailable } from '@silverpoint/marp/client';
import { useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, version, type ComponentType, type ReactElement, type ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import { SilverpointContext } from '../context';
import { styleObject } from '../style';
import { renderUi } from '../ui/render';
import { CHART_LOADERS } from './chart-loaders';

/**
 * `SpDeck` (T-273, REQ-608..REQ-612, API delta §6): a Marp/Marpit Markdown deck in the ground's
 * hand. The markup is `deckView`'s (Art. 2, Art. 3); this binds it: the controller's state through
 * `useSyncExternalStore`, the client half after mount (`attachDeck`), and each fence chart mounted
 * with `createPortal` in place of its static SVG. Every prop is a string, number or boolean, and
 * every event one plain object (REQ-609), so a Python wrapper can drive it.
 */
export interface SpDeckProps {
  /** The Marp Markdown: front matter, `---` between slides, `silverpoint` fences for charts. */
  readonly markdown: string;
  /** Controlled current page (1-based); pair it with `onPageChange`. */
  readonly page?: number;
  /** Uncontrolled initial page (1-based). Default `1`. */
  readonly defaultPage?: number;
  /** The deck's id, which scopes its CSS and names its charts; the adapter's hydration-safe id by default. */
  readonly id?: string;
  /** Accessible name of the deck region; the first heading of slide 1 by default. */
  readonly label?: string;
  /** The Marpit theme. Default `'silverpoint'`. */
  readonly theme?: string;
  /** The deck's ground, which a `ground` directive overrides per slide. Default `'silverpoint'`. */
  readonly ground?: string;
  /** The deck's substrate; the ground's first by default. */
  readonly substrate?: string;
  /** `ink` or `precision`, which a `mode` directive overrides per slide. Default `'ink'`. */
  readonly mode?: DeckMode;
  /** A palette preset's name, for the fence charts (REQ-609). */
  readonly palette?: string;
  /** The slide size. Default `'16:9'`. */
  readonly size?: DeckSize;
  /** Show the current slide's notes (Marpit comments). Default `false`. */
  readonly showNotes?: boolean;
  /** Show the controls: previous, next, overview, notes, full screen. Default `true`. */
  readonly showControls?: boolean;
  /** Handle the keys while focus is in the deck (API delta §7.3). Default `true`. */
  readonly keyboard?: boolean;
  /** A horizontal swipe moves the deck. Default `true`. */
  readonly swipe?: boolean;
  /** Read and write a `#<n>` deep link (REQ-602). Default `false`. */
  readonly hash?: boolean;
  /** Hydrate the fence charts (REQ-594). Default `true`. */
  readonly interactive?: boolean;
  readonly onPageChange?: (payload: DeckEvents['pageChange']) => void;
  readonly onFragmentChange?: (payload: DeckEvents['fragmentChange']) => void;
  readonly onReady?: (payload: DeckEvents['ready']) => void;
}

/** React 19 takes `inert` as a boolean; React 18 does not know it and needs the empty string. */
const INERT: true | '' = Number.parseInt(version, 10) >= 19 ? true : '';

const PROPS: Readonly<Record<string, string>> = { class: 'className', tabindex: 'tabIndex' };
const BOOLEAN = new Set(['hidden', 'disabled']);

/** The view's attributes as React props: a `true` flag is an empty attribute, as on the server. */
function props(attrs: ViewAttrs): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    if (name === 'style' && typeof value === 'string') out.style = styleObject(value);
    else if (name === 'inert') out.inert = INERT;
    else out[PROPS[name] ?? name] = value === true && !BOOLEAN.has(name) ? '' : value;
  }
  return out;
}

const groundName = (ground: ProviderConfig['ground']) => (typeof ground === 'string' ? ground : ground?.name);

interface Mounted {
  readonly key: string;
  readonly element: HTMLElement;
  readonly Chart: ComponentType<Record<string, unknown>>;
  readonly props: Readonly<Record<string, unknown>>;
}

export function SpDeck({
  markdown,
  page,
  defaultPage,
  id,
  label,
  theme,
  size,
  showNotes = false,
  showControls = true,
  keyboard = true,
  swipe = true,
  hash = false,
  interactive = true,
  onPageChange,
  onFragmentChange,
  onReady,
  ...own
}: SpDeckProps): ReactElement {
  const provider = useContext(SilverpointContext);
  const generated = useId();
  const deckId = sanitiseDeckId(id ?? generated);
  const ground = own.ground ?? groundName(provider.ground) ?? 'silverpoint';
  const substrate = own.substrate ?? (own.ground === undefined ? (provider.substrate as string | undefined) : undefined);
  const mode = own.mode ?? provider.mode ?? 'ink';
  const palette = own.palette ?? provider.palette;
  const locale = provider.locale;

  const render = useMemo(
    () =>
      createDeckEngine({
        id: deckId,
        ground,
        ...(substrate === undefined ? {} : { substrate }),
        mode,
        ...(theme === undefined ? {} : { theme }),
        ...(size === undefined ? {} : { size }),
        ...(locale === undefined ? {} : { locale }),
        ...(palette === undefined ? {} : { palette }),
      }).render(markdown),
    [deckId, ground, substrate, mode, theme, size, locale, palette, markdown],
  );
  const steps = useMemo(() => render.slides.map((s) => s.fragments), [render]);

  const [controller] = useState<DeckController>(() =>
    createDeckController({ total: render.total, steps, ...(page === undefined ? (defaultPage === undefined ? {} : { defaultPage }) : { page }) }),
  );
  const state = useSyncExternalStore(
    (notify) => controller.on('state', notify),
    () => controller.state,
    () => controller.state,
  );

  // The events, through refs: a new handler each render rebinds nothing.
  const handlers = useRef({ onPageChange, onFragmentChange, onReady });
  handlers.current = { onPageChange, onFragmentChange, onReady };
  // Whether the first `ready` reached the host; a ref, so StrictMode's replayed effect keeps it.
  const announced = useRef(false);
  useEffect(() => {
    let live = true;
    const off = [
      controller.on('pageChange', (p) => handlers.current.onPageChange?.(p)),
      controller.on('fragmentChange', (p) => handlers.current.onFragmentChange?.(p)),
      controller.on('ready', (p) => {
        announced.current = true;
        handlers.current.onReady?.(p);
      }),
    ];
    // The controller emits the first `ready` in a microtask queued at creation, during render;
    // React may run this effect after it (#8). This microtask runs after the controller's: if
    // that one found no listener, the adapter delivers the first `ready` itself, once.
    queueMicrotask(() => {
      if (!live || announced.current) return;
      announced.current = true;
      handlers.current.onReady?.(Object.freeze({ total: controller.state.total }));
    });
    return () => {
      live = false;
      off.forEach((fn) => fn());
    };
  }, [controller]);
  // No `controller.destroy()` on cleanup: StrictMode replays effects (mount → cleanup → mount) on
  // the same `useState` instance, and a destroyed controller ignores every action (#7). The
  // subscriptions above, `useSyncExternalStore`'s and `attachDeck`'s are torn down by their own
  // cleanups; the controller then holds no listener and nothing outside the component holds it.

  useEffect(() => controller.setTotal(render.total, steps), [controller, render, steps]);
  useEffect(() => {
    if (page !== undefined) controller.setControlledPage(page);
  }, [controller, page]);
  useEffect(() => controller.toggleNotes(showNotes), [controller, showNotes]);

  // Known after mount only, so the server and the first client render agree (REQ-603, REQ-612).
  const [canFullscreen, setCanFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState<readonly Mounted[]>([]);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    setCanFullscreen(fullscreenAvailable(element));
    const plan = interactive ? hydrationPlan(render, palette) : [];
    return attachDeck(element, controller, { keyboard, swipe, hash }, {
      plan,
      mountChart: (slot, entry) => {
        let live = true;
        const load = CHART_LOADERS[entry.chart];
        if (!load) return () => {};
        void load().then((Chart) => {
          if (!live) return;
          // The framework chart replaces the static one: the same tree, now interactive (Art. 3).
          slot.replaceChildren();
          slot.setAttribute('data-sp-hydrated', '');
          setMounted((all) => [...all, { key: `${render.id}:${entry.slotId}`, element: slot, Chart, props: entry.props }]);
        });
        return () => {
          live = false;
          setMounted((all) => all.filter((m) => m.element !== slot));
        };
      },
    });
  }, [controller, render, palette, interactive, keyboard, swipe, hash]);

  const view = deckView(render, state, {
    ...(label === undefined ? {} : { label }),
    showControls,
    fullscreenAvailable: canFullscreen,
    ground,
    ...(substrate === undefined ? {} : { substrate }),
    mode,
  });

  const portals: ReactPortal[] = mounted.map((m) => createPortal(<m.Chart {...m.props} />, m.element, m.key));
  return (
    <div {...props(view.root)} ref={rootRef}>
      {/* React 18 escapes a style's text on the server (`>` → `&gt;`), which breaks the CSS and
          the hydration; the engine's CSS holds no `<` (sanitiseDeckCss), so raw text is safe. */}
      {/* eslint-disable-next-line no-restricted-syntax -- DD-055 (T-277 amendment): the deck's sanitised CSS. */}
      <style dangerouslySetInnerHTML={{ __html: view.css }} />
      <div {...props(view.viewport)}>
        <div {...props(view.container)}>
          {view.slides.map((slide) => (
            // The engine's own output: Markdown HTML is off and not configurable (REQ-572, REQ-575).
            // eslint-disable-next-line no-restricted-syntax -- DD-055 (T-275 amendment): the slide box holds the engine's markup, never user markup.
            <div key={slide.key} {...props(slide.attrs)} dangerouslySetInnerHTML={{ __html: slide.html }} />
          ))}
        </div>
      </div>
      {view.notes && (
        <aside {...props(view.notes.attrs)}>
          {view.notes.paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </aside>
      )}
      {view.controls && renderUi(view.controls, {}, false)}
      <p {...props(view.status.attrs)}>{view.status.text}</p>
      {portals}
    </div>
  );
}
