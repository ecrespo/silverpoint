/**
 * `validate_deck` and `render_deck` (feature-006, API delta §11, REQ-620, DD-060): the engine of
 * `@silverpoint/marp` over the Markdown, as every adapter runs it. `validate_deck` returns what the
 * render raises, per slide and per fence; `render_deck` writes the deck's view with `deckMarkup`,
 * controls omitted, into a standalone document — every slide, or one — with the ground's and the
 * deck's stylesheets inlined. Pure and deterministic (Art. 4): the deck's id is fixed.
 */
import { createDeckEngine, deckMarkup, deckView, type DeckDiagnostic, type DeckRender, type DeckSize } from '@silverpoint/marp';
import { DECK_CSS } from '../assets.generated';
import type { Catalog } from '../catalog';
import { capturing } from '../diagnostics';
import { ToolError } from '../errors';
import { FONT_FACE, STANDALONE_STYLE } from './render';

export interface DeckInput {
  readonly markdown: string;
}

export interface RenderDeckInput extends DeckInput {
  /** One slide (1-based); every slide when absent. */
  readonly slide?: number;
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: string;
  /** A preset's name. */
  readonly palette?: string;
  readonly size?: string;
  readonly embedFonts?: boolean;
}

export interface ReportedDeckDiagnostic {
  readonly code: string;
  readonly severity: 'warn' | 'error';
  readonly req: string;
  readonly message: string;
  readonly todo: string;
  readonly slide?: number;
  readonly slot?: string;
}

/** The deck's id in every document: its CSS scope and its charts' ids, the same for the same input. */
export const DECK_ID = 'deck';
const SIZES: readonly DeckSize[] = ['16:9', '4:3'];
/** The document's own layout: the slides one under another, at most the canvas wide. */
const DOCUMENT_CSS = 'body{margin:0;padding:24px}.sp-deck{max-width:1280px;margin:0 auto}.sp-deck-slide+.sp-deck-slide{margin-top:24px}';

function reported(catalog: Catalog, d: DeckDiagnostic): ReportedDeckDiagnostic {
  const known = catalog.data.diagnostics.find((k) => k.code === d.code);
  return {
    code: d.code,
    severity: d.severity,
    req: known?.req ?? '',
    message: d.message,
    todo: known?.todo ?? '',
    ...(d.slide === undefined ? {} : { slide: d.slide }),
    ...(d.slot === undefined ? {} : { slot: d.slot }),
  };
}

/** In slide order, a deck-wide one first; the engine's order within a slide (stable sort). */
const bySlide = (catalog: Catalog, render: DeckRender): ReportedDeckDiagnostic[] =>
  render.diagnostics.map((d) => reported(catalog, d)).sort((a, b) => (a.slide ?? 0) - (b.slide ?? 0));

const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The engine's render, its warnings kept off the console: the result carries them (DD-048). */
function rendered(catalog: Catalog, options: Parameters<typeof createDeckEngine>[0], markdown: string): DeckRender {
  const { value } = capturing(catalog, () => createDeckEngine(options).render(markdown));
  if (!value) throw new ToolError('render_failed', 'The deck could not be rendered.');
  return value;
}

export function validateDeck(catalog: Catalog, input: DeckInput): { valid: boolean; total: number; diagnostics: ReportedDeckDiagnostic[] } {
  const render = rendered(catalog, { id: DECK_ID }, input.markdown);
  const diagnostics = bySlide(catalog, render);
  return { valid: diagnostics.length === 0, total: render.total, diagnostics };
}

export function renderDeck(catalog: Catalog, input: RenderDeckInput): { html: string; total: number; diagnostics: ReportedDeckDiagnostic[] } {
  const ground = input.ground === undefined ? undefined : catalog.ground(input.ground);
  const substrate = input.substrate === undefined ? undefined : catalog.substrate(ground ?? 'silverpoint', input.substrate);
  const mode = input.mode === undefined ? undefined : catalog.oneOf('mode', input.mode, ['ink', 'precision'] as const);
  const palette = input.palette === undefined ? undefined : catalog.palette(input.palette);
  const size = input.size === undefined ? undefined : catalog.oneOf('size', input.size, SIZES);

  const render = rendered(
    catalog,
    {
      id: DECK_ID,
      ...(ground ? { ground } : {}),
      ...(substrate ? { substrate } : {}),
      ...(mode ? { mode } : {}),
      ...(palette ? { palette } : {}),
      ...(size ? { size } : {}),
    },
    input.markdown,
  );
  const slide = input.slide;
  if (slide !== undefined && !(Number.isInteger(slide) && slide >= 1 && slide <= render.total)) {
    throw new ToolError('invalid_input', `\`slide\` is ${slide}; the deck has ${render.total} slide${render.total === 1 ? '' : 's'}.`);
  }

  const view = deckView(
    render,
    { page: slide ?? 1, step: 0, overview: false, notes: false, fullscreen: false },
    { showControls: false, fullscreenAvailable: false, ground: ground ?? 'silverpoint', ...(substrate ? { substrate } : {}), mode: mode ?? 'ink' },
  );
  // One slide alone, or every slide shown: a document has no current page to hide the others
  // behind, nor a step to reveal fragments by, so every fragment is shown, as in print (REQ-597).
  // Markdown HTML is off (REQ-572): the attribute can only be the engine's.
  const revealed = (html: string) => html.replace(/ data-sp-pending=""/g, '');
  const slides =
    slide === undefined
      ? view.slides.map((s) => {
          const { hidden: _hidden, inert: _inert, 'data-sp-current': _current, ...attrs } = s.attrs;
          return { ...s, attrs, html: revealed(s.html) };
        })
      : view.slides.filter((s) => s.attrs['data-sp-slide'] === String(slide)).map((s) => ({ ...s, html: revealed(s.html) }));
  const status = { ...view.status, text: slide === undefined ? `${render.total} slides` : view.status.text };
  const body = deckMarkup({ ...view, slides, status });

  const title = escapeText(String(view.root['aria-label'] ?? 'Deck'));
  const style = `${input.embedFonts ? FONT_FACE : ''}${STANDALONE_STYLE}${DECK_CSS}${DOCUMENT_CSS}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${style}</style></head><body>${body}</body></html>`;
  return { html, total: render.total, diagnostics: bySlide(catalog, render) };
}
