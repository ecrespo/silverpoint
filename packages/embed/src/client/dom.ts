/**
 * The client's nodes (DD-063, REQ-637): the core's `SvgView` and the chart root's parts, built with
 * `createElementNS` / `createElement`, `setAttribute` and `textContent`. Never a string parsed as
 * markup; the palette's declarations through `style.setProperty`. API Spec §10 is the contract, and
 * `toChartRootString` the reference it is compared against (I-56).
 */
import type { PathView, Readout } from '@silverpoint/core';
import type { RenderedChart } from '@silverpoint/grounds';

const SVG = 'http://www.w3.org/2000/svg';
type Attrs = readonly (readonly [string, string | null | undefined])[];

export function element(document: Document, ns: string | null, name: string, attrs: Attrs, text?: string): Element {
  const node = ns ? document.createElementNS(ns, name) : document.createElement(name);
  for (const [k, v] of attrs) if (v !== null && v !== undefined) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** `--sp-x: v; …` → `style.setProperty` per declaration (REQ-643). */
export function declare(node: Element, declarations: string): void {
  const style = (node as HTMLElement | SVGElement).style;
  for (const part of declarations.split(';')) {
    const at = part.indexOf(':');
    if (at > 0) style.setProperty(part.slice(0, at).trim(), part.slice(at + 1).trim());
  }
}

const pathNode = (document: Document, p: PathView): Element =>
  element(document, SVG, 'path', [['d', p.d], ['part', p.part], ['data-role', p.role], ['data-paint', p.paint], ['data-dash', p.dash], ['data-weight', p.weight], ['fill', p.fill]]);

/** The canonical `<svg>` of a rendered chart (`svgString`'s elements, one to one). */
export function svgNode(document: Document, rendered: RenderedChart): Element {
  const { view } = rendered;
  const s = view.svg;
  const svg = element(document, SVG, 'svg', [['xmlns', SVG], ['viewBox', s.viewBox], ['width', s.width], ['height', s.height], ['class', s.class], ['data-substrate', s.substrate], ['data-mode', s.mode], ['role', s.role], ['aria-labelledby', s.labelledby]]);
  if (rendered.style) declare(svg, rendered.style);
  svg.append(element(document, SVG, 'title', [['id', view.title.id]], view.title.text), element(document, SVG, 'desc', [['id', view.desc.id]], view.desc.text));
  if (view.patterns.length > 0) {
    const defs = element(document, SVG, 'defs', []);
    for (const p of view.patterns) {
      const pattern = element(document, SVG, 'pattern', [['id', p.id], ['width', p.width], ['height', p.height], ['patternUnits', 'userSpaceOnUse'], ['patternTransform', p.transform]]);
      pattern.append(...p.paths.map((path) => pathNode(document, path)));
      defs.append(pattern);
    }
    svg.append(defs);
  }
  svg.append(...view.paths.map((path) => pathNode(document, path)));
  for (const t of view.texts) svg.append(element(document, SVG, 'text', [['x', t.x], ['y', t.y], ['part', t.part], ['data-kind', t.kind], ['text-anchor', t.anchor]], t.text));
  return svg;
}

/** The tabular alternative, or `null` when the chart has none. */
export function tableNode(document: Document, rendered: RenderedChart): Element | null {
  if (rendered.dataTable === 'none') return null;
  const t = rendered.table;
  const box = element(document, null, 'div', [['class', 'sp-table-box'], ['data-visibility', rendered.dataTable]]);
  const table = element(document, null, 'table', [['class', 'sp-table'], ['id', rendered.ids.table], ['data-visibility', rendered.dataTable]]);
  const head = element(document, null, 'tr', []);
  head.append(...t.columns.map((c) => element(document, null, 'th', [['scope', 'col']], String(c))));
  const thead = element(document, null, 'thead', []);
  thead.append(head);
  const tbody = element(document, null, 'tbody', []);
  for (const row of t.rows) {
    const tr = element(document, null, 'tr', []);
    tr.append(...row.map((cell, i) => (i === 0 ? element(document, null, 'th', [['scope', 'row']], String(cell)) : element(document, null, 'td', [], String(cell)))));
    tbody.append(tr);
  }
  table.append(element(document, null, 'caption', [], t.caption), thead, tbody);
  box.append(table);
  return box;
}

/** Writes the root's own attributes for a render, as `toChartRootString` does. */
export function applyRoot(root: HTMLElement, rendered: RenderedChart): void {
  root.setAttribute('class', `sp-root sp-ground-${rendered.ground}`);
  root.setAttribute('data-substrate', rendered.substrate);
  root.setAttribute('data-chrome', rendered.chrome);
  root.setAttribute('data-status', rendered.status);
  root.removeAttribute('style');
  if (rendered.style) declare(root, rendered.style);
  root.setAttribute('tabindex', '0');
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', rendered.name);
}

/** The marker and the readout of the active item (the adapters' `Overlay`, DD-064). */
export function overlayNodes(document: Document, rendered: RenderedChart, current: Readout): Element[] {
  const marker = element(document, SVG, 'svg', [['class', 'sp-marker'], ['viewBox', rendered.view.svg.viewBox], ['aria-hidden', 'true'], ['focusable', 'false']]);
  marker.append(element(document, SVG, 'path', [['d', current.marker.d]]));
  const box = element(document, null, 'div', [['class', 'sp-readout'], ['aria-hidden', 'true']]) as HTMLElement;
  box.style.setProperty('left', current.left);
  box.style.setProperty('top', current.top);
  box.append(element(document, null, 'span', [['class', 'sp-readout-heading']], current.heading), document.createTextNode(current.text));
  return [marker, box];
}

/** The error figure (REQ-668, the deck fence's): the message as text, in the ground's type. */
export function errorFigure(document: Document, message: string): Element {
  const figure = element(document, null, 'figure', [['class', 'sp-embed-error'], ['role', 'alert'], ['part', 'sp-embed-error']]);
  figure.append(element(document, null, 'figcaption', [], message));
  return figure;
}

/** Two nodes describe the same tree: tag, attributes (`style` as declarations), children, text (analyze A-02). */
export function sameTree(a: Node, b: Node): boolean {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType === 3) return a.textContent === b.textContent;
  if (a.nodeType !== 1) return true;
  const x = a as Element;
  const y = b as Element;
  if (x.localName !== y.localName) return false;
  const attrs = (e: Element) =>
    [...e.attributes]
      .filter((attr) => attr.name !== 'xmlns')
      .map((attr) => `${attr.name}=${attr.name === 'style' ? styleKey(attr.value) : attr.value}`)
      .sort()
      .join('\u0000');
  if (attrs(x) !== attrs(y)) return false;
  const kids = (e: Element) => [...e.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent !== ''));
  const xs = kids(x);
  const ys = kids(y);
  return xs.length === ys.length && xs.every((n, i) => sameTree(n, ys[i]!));
}

const styleKey = (value: string): string =>
  value
    .split(';')
    .map((d) => d.trim().replace(/\s*:\s*/, ':'))
    .filter(Boolean)
    .sort()
    .join(';');
