/**
 * The deck's view (T-276, Art. 2, Art. 3, API delta §8): everything `SpDeck` writes, computed once
 * for the three adapters. Each adapter renders it with a fixed template —the root, the viewport, the
 * Marpit container, one box per slide with the engine's HTML inside, the notes, the controls (a
 * core UI tree) and the live status— and adds only the bindings.
 *
 * A slide's inner HTML never depends on the state: the adapters write it once per render, so the
 * charts they hydrate inside it survive navigation; the client moves fragments (DD-057).
 */
import { diagnose } from '@silverpoint/core';
import { listGrounds } from '@silverpoint/grounds';
import { resolveUi, uiButtonView, type UiAttrValue, type UiElement, type UiNode } from '@silverpoint/core/ui';
import type { DeckMode, DeckRender } from './types';

export type ViewAttrs = Readonly<Record<string, UiAttrValue | undefined>>;

/** What the view reads of the controller's state. */
export interface DeckViewState {
  readonly page: number;
  readonly step: number;
  readonly overview: boolean;
  readonly notes: boolean;
  readonly fullscreen: boolean;
}

export interface DeckViewOptions {
  readonly label?: string;
  readonly showControls: boolean;
  /** Whether the Fullscreen API is there (REQ-603); the server renders without the button. */
  readonly fullscreenAvailable: boolean;
  /** The deck's resolved defaults, which draw the chrome. */
  readonly ground: string;
  /** Default: the ground's first substrate. */
  readonly substrate?: string;
  readonly mode: DeckMode;
  /** A palette's custom properties for the root (`paletteStyle`). */
  readonly style?: string;
}

export interface DeckSlideView {
  /** A stable key for the framework's list. */
  readonly key: string;
  readonly attrs: ViewAttrs;
  /** The slide's `<svg>`, as the engine wrote it. */
  readonly html: string;
}

export interface DeckView {
  readonly root: ViewAttrs;
  readonly viewport: ViewAttrs;
  /** Marpit's container: the CSS scope, and the overview's grid. */
  readonly container: ViewAttrs;
  readonly slides: readonly DeckSlideView[];
  readonly notes?: { readonly attrs: ViewAttrs; readonly paragraphs: readonly string[] };
  readonly controls?: UiElement;
  readonly status: { readonly attrs: ViewAttrs; readonly text: string };
  /** The deck's scoped `<style>`. */
  readonly css: string;
}

/** The overview's columns: deck.css's default, and what the keyboard moves by (REQ-604). */
export const OVERVIEW_COLUMNS = 4;

const BOX_OPEN = '<div class="sp-deck-slide">';
const BOX_CLOSE = '</div>';

function inner(html: string): string {
  return html.startsWith(BOX_OPEN) && html.endsWith(BOX_CLOSE) ? html.slice(BOX_OPEN.length, -BOX_CLOSE.length) : html;
}

function nameOf(render: DeckRender, label: string | undefined): string {
  if (label && label.trim() !== '') return label;
  const heading = render.slides[0]?.heading;
  if (heading) return heading;
  diagnose('SP018', 'SpDeck', { property: 'label', message: 'the deck has no `label` and its first slide no heading: it is announced as "Slide deck".' });
  return 'Slide deck';
}

/** The core's button with its text in place of the content slot, told apart by `data-sp-action`. */
function control(
  r: ReturnType<typeof resolveUi>,
  action: string,
  label: string,
  text: string,
  extra: { readonly disabled?: boolean; readonly pressed?: boolean },
): UiElement {
  const button = uiButtonView({ label, ...(extra.disabled ? { disabled: true } : {}) }, r, { text });
  const fill = (node: UiNode): UiNode => ('slot' in node && node.slot === 'content' ? { text } : 'tag' in node ? { ...node, children: node.children.map(fill) } : node);
  const attrs: Record<string, UiAttrValue> = {};
  for (const [k, v] of Object.entries(button.attrs)) if (v !== undefined) attrs[k] = v;
  attrs['data-sp-action'] = action;
  if (extra.pressed !== undefined) attrs['aria-pressed'] = String(extra.pressed);
  return { ...button, attrs, children: button.children.map(fill), bind: 'trigger' };
}

export function deckView(render: DeckRender, state: DeckViewState, options: DeckViewOptions): DeckView {
  const { page, step, overview } = state;
  const total = render.total;
  const current = render.slides[page - 1];
  const known = listGrounds().find((g) => g.name === options.ground);
  const substrate = options.substrate ?? (known ? Object.keys(known.substrates)[0] : undefined) ?? '';

  const root: Record<string, UiAttrValue> = {
    class: `sp-deck sp-ground-${options.ground}`,
    part: 'sp-deck',
    role: 'region',
    'aria-roledescription': 'slide deck',
    'aria-label': nameOf(render, options.label),
    tabindex: '0',
    'data-substrate': substrate,
    'data-mode': options.mode,
    'data-sp-page': String(page),
    'data-sp-step': String(step),
    'data-sp-overview': String(overview),
  };
  if (options.style) root.style = options.style;

  const slides = render.slides.map((slide): DeckSlideView => {
    const n = slide.index;
    const attrs: Record<string, UiAttrValue> = { class: overview ? 'sp-deck-slide sp-deck-thumb' : 'sp-deck-slide', 'data-sp-slide': String(n) };
    if (n === page) attrs['data-sp-current'] = true;
    if (overview) {
      attrs.role = 'button';
      attrs.tabindex = '0';
      attrs['aria-label'] = `Go to slide ${n} of ${total}`;
      if (n === page) attrs['aria-current'] = 'true';
    } else if (n !== page) {
      attrs.hidden = true;
      attrs.inert = true;
    }
    return { key: `${render.id}-${n}`, attrs, html: inner(slide.html) };
  });

  let controls: UiElement | undefined;
  if (options.showControls) {
    const r = resolveUi({ ground: options.ground, substrate: substrate as never, mode: options.mode, size: 'sm' }, {});
    const last = page >= total && step >= (current?.fragments ?? 0);
    const children: UiNode[] = [
      control(r, 'prev', 'Previous slide', '‹', { disabled: page <= 1 && step <= 0 }),
      { tag: 'span', attrs: { class: 'sp-deck-counter', part: 'sp-deck-counter' }, children: [{ text: `${page} / ${total}` }] },
      control(r, 'next', 'Next slide', '›', { disabled: last }),
      control(r, 'overview', 'Overview', 'Overview', { pressed: overview }),
      control(r, 'notes', 'Speaker notes', 'Notes', { pressed: state.notes }),
    ];
    if (options.fullscreenAvailable) children.push(control(r, 'fullscreen', 'Full screen', 'Full screen', { pressed: state.fullscreen }));
    controls = { tag: 'div', attrs: { class: 'sp-deck-controls', part: 'sp-deck-controls', role: 'toolbar', 'aria-label': 'Deck controls' }, children };
  }

  return {
    root,
    viewport: { class: 'sp-deck-viewport', part: 'sp-deck-viewport' },
    container: overview
      ? { class: `sp-deck-${render.id} sp-deck-overview`, part: 'sp-deck-overview', 'data-sp-columns': String(OVERVIEW_COLUMNS) }
      : { class: `sp-deck-${render.id}` },
    slides,
    ...(state.notes
      ? { notes: { attrs: { class: 'sp-deck-notes', part: 'sp-deck-notes', 'aria-label': 'Speaker notes' }, paragraphs: (current?.notes ?? []).map((n) => n.trim()).filter((n) => n !== '') } }
      : {}),
    ...(controls ? { controls } : {}),
    status: { attrs: { class: 'sp-deck-status', 'aria-live': 'polite' }, text: `Slide ${page} of ${total}` },
    css: render.css,
  };
}
