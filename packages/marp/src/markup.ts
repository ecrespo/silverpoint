/**
 * The deck's static HTML (T-278, REQ-623): `deckView` written out as the adapters write it on the
 * server, so it is the canonical render the tree gate compares them with, and what an agent's
 * `render_deck` returns. Pure: no DOM.
 */
import type { UiElement, UiNode } from '@silverpoint/core/ui';
import type { DeckView, ViewAttrs } from './view';

const VOID = new Set(['area', 'br', 'col', 'hr', 'img', 'input', 'wbr']);

const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (value: string) => escapeText(value).replace(/"/g, '&quot;');

function attributes(attrs: ViewAttrs): string {
  let out = '';
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined) out += ` ${name}="${value === true ? '' : escapeAttr(value)}"`;
  return out;
}

function node(n: UiNode): string {
  if ('text' in n) return escapeText(n.text);
  // The controls carry no slots; a slot would be an adapter's content, which a deck has none of.
  if ('slot' in n) return '';
  return element(n);
}

function element(e: UiElement): string {
  const open = `<${e.tag}${attributes(e.attrs)}>`;
  return VOID.has(e.tag) ? open : `${open}${e.children.map(node).join('')}</${e.tag}>`;
}

/** The deck as HTML: root, scoped style, viewport and slides, notes, controls, status. */
export function deckMarkup(view: DeckView): string {
  // The slides' HTML and the CSS are the engine's own: Markdown HTML is off (REQ-572, REQ-575), and
  // `sanitiseDeckCss` leaves no `<` in the CSS, so neither can close its element.
  const slides = view.slides.map((slide) => `<div${attributes(slide.attrs)}>${slide.html}</div>`).join('');
  const notes = view.notes ? `<aside${attributes(view.notes.attrs)}>${view.notes.paragraphs.map((p) => `<p>${escapeText(p)}</p>`).join('')}</aside>` : '';
  const controls = view.controls ? element(view.controls) : '';
  return (
    `<div${attributes(view.root)}><style>${view.css}</style>` +
    `<div${attributes(view.viewport)}><div${attributes(view.container)}>${slides}</div></div>` +
    `${notes}${controls}<p${attributes(view.status.attrs)}>${escapeText(view.status.text)}</p></div>`
  );
}
