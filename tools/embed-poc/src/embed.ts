/**
 * PoC of `@silverpoint/embed` (feature-007, T-290, DD-062): a prototype of the DOM-free render and
 * of the client, written only to measure the standalone file and to run it in the sandboxes of
 * DD-062's protocol. It is not the package: no validation beyond the chart slug, no limits, no
 * element attributes beyond `chart`. Every picture still comes from `renderChart` (Art. 2).
 */
import { FORCED_PRECISION_QUERY, readout, reduceInteraction } from '@silverpoint/core';
import type * as core from '@silverpoint/core';
import { RECIPES as REGISTRY } from './registry.generated';
import { PALETTES } from '@silverpoint/core/palettes';
import { renderChart, toSVGString, toChartRootString, type RenderedChart } from '@silverpoint/grounds';
import GROUND_CSS from '@silverpoint/grounds/styles-text';
import { FONT_CSS } from 'embed-poc:fonts';

declare const __VERSION__: string;
export const VERSION: string = __VERSION__;

type Recipe = core.ChartRecipe<core.CommonChartProps>;
const RECIPES = REGISTRY as ReadonlyMap<string, Recipe>;
export const CHART_SLUGS: readonly string[] = [...RECIPES.keys()];

export interface ChartSpec {
  readonly chart: string;
  readonly data?: readonly Readonly<Record<string, unknown>>[];
  readonly props?: Readonly<Record<string, unknown>>;
  readonly width?: number;
  readonly height?: number;
  readonly id?: string;
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: 'ink' | 'precision';
  readonly palette?: string;
}

export function renderSpec(spec: ChartSpec, env: { width?: number; forcedPrecision?: boolean; id?: string } = {}): RenderedChart {
  const recipe = RECIPES.get(spec.chart);
  if (!recipe) throw new Error(`Unknown chart "${spec.chart}".`);
  const id = spec.id ?? env.id ?? spec.chart;
  const props = {
    ...spec.props,
    ...(spec.data === undefined ? {} : { data: spec.data }),
    id,
    ...(spec.width === undefined ? {} : { width: spec.width }),
    ...(spec.height === undefined ? {} : { height: spec.height }),
    ...(spec.ground === undefined ? {} : { ground: spec.ground }),
    ...(spec.substrate === undefined ? {} : { substrate: spec.substrate }),
    ...(spec.mode === undefined ? {} : { mode: spec.mode }),
    ...(spec.palette === undefined ? {} : { palette: (PALETTES as Record<string, unknown>)[spec.palette] }),
  };
  return renderChart(recipe, props as never, { id, width: spec.width ?? env.width ?? 480, forcedPrecision: env.forcedPrecision });
}

export function renderToSVG(spec: ChartSpec, options: { embedFonts?: boolean } = {}): string {
  const markup = toSVGString(renderSpec(spec));
  const open = markup.indexOf('>') + 1;
  return `${markup.slice(0, open)}<style>${options.embedFonts ? FONT_CSS : ''}${GROUND_CSS}</style>${markup.slice(open)}`;
}

export { toChartRootString };

// ---------------------------------------------------------------- client (browser only)

const SVG = 'http://www.w3.org/2000/svg';
type Attrs = readonly (readonly [string, string | null])[];

function el(ns: string | null, name: string, attrs: Attrs, text?: string): Element {
  const node = ns ? document.createElementNS(ns, name) : document.createElement(name);
  for (const [k, v] of attrs) if (v !== null) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Palette declarations through the CSSOM, never a `style` attribute (DD-063, REQ-643). */
function declare(node: Element, declarations: string): void {
  for (const part of declarations.split(';')) {
    const at = part.indexOf(':');
    if (at > 0) (node as HTMLElement).style.setProperty(part.slice(0, at).trim(), part.slice(at + 1).trim());
  }
}

const pathNode = (p: core.PathView): Element =>
  el(SVG, 'path', [['d', p.d], ['part', p.part], ['data-role', p.role], ['data-paint', p.paint], ['data-dash', p.dash], ['data-weight', p.weight], ['fill', p.fill]]);

function svgNode(rendered: RenderedChart): Element {
  const { view } = rendered;
  const s = view.svg;
  const svg = el(SVG, 'svg', [['viewBox', s.viewBox], ['width', s.width], ['height', s.height], ['class', s.class], ['data-substrate', s.substrate], ['data-mode', s.mode], ['role', s.role], ['aria-labelledby', s.labelledby]]);
  if (rendered.style) declare(svg, rendered.style);
  svg.append(el(SVG, 'title', [['id', view.title.id]], view.title.text), el(SVG, 'desc', [['id', view.desc.id]], view.desc.text));
  if (view.patterns.length > 0) {
    const defs = el(SVG, 'defs', []);
    for (const p of view.patterns) {
      const pattern = el(SVG, 'pattern', [['id', p.id], ['width', p.width], ['height', p.height], ['patternUnits', 'userSpaceOnUse'], ['patternTransform', p.transform]]);
      pattern.append(...p.paths.map(pathNode));
      defs.append(pattern);
    }
    svg.append(defs);
  }
  svg.append(...view.paths.map(pathNode));
  for (const t of view.texts) svg.append(el(SVG, 'text', [['x', t.x], ['y', t.y], ['part', t.part], ['data-kind', t.kind], ['text-anchor', t.anchor]], t.text));
  return svg;
}

function tableNode(rendered: RenderedChart): Element | null {
  if (rendered.dataTable === 'none') return null;
  const t = rendered.table;
  const box = el(null, 'div', [['class', 'sp-table-box'], ['data-visibility', rendered.dataTable]]);
  const table = el(null, 'table', [['class', 'sp-table'], ['id', rendered.ids.table], ['data-visibility', rendered.dataTable]]);
  const head = el(null, 'tr', []);
  head.append(...t.columns.map((c) => el(null, 'th', [['scope', 'col']], String(c))));
  const thead = el(null, 'thead', []);
  thead.append(head);
  const tbody = el(null, 'tbody', []);
  for (const row of t.rows) {
    const tr = el(null, 'tr', []);
    tr.append(...row.map((cell, i) => (i === 0 ? el(null, 'th', [['scope', 'row']], String(cell)) : el(null, 'td', [], String(cell)))));
    tbody.append(tr);
  }
  table.append(el(null, 'caption', [], t.caption), thead, tbody);
  box.append(table);
  return box;
}

const adopted = new WeakSet<Document | ShadowRoot>();
function adoptStyles(root: Document | ShadowRoot, fonts: boolean): 'adopted' | 'element' {
  if (adopted.has(root)) return 'adopted';
  adopted.add(root);
  const text = (fonts ? FONT_CSS : '') + GROUND_CSS;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(text);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    return 'adopted';
  } catch {
    const style = document.createElement('style');
    style.textContent = text;
    (root instanceof Document ? root.head : root).append(style);
    return 'element';
  }
}

export interface Handle {
  update(spec: ChartSpec): void;
  destroy(): void;
  readonly root: HTMLElement;
}

let counter = 0;
export function mount(target: Element, spec: ChartSpec, options: { fonts?: 'embedded' | 'none' } = {}): Handle {
  adoptStyles(target.getRootNode() as Document | ShadowRoot, options.fonts === 'embedded' && FONT_CSS !== '');
  const id = `sp-embed-${++counter}`;
  const forced = FORCED_PRECISION_QUERY ? matchMedia(FORCED_PRECISION_QUERY) : null;
  let current = spec;
  let active: core.ActiveItem | null = null;
  let rendered: RenderedChart;
  const root = el(null, 'div', [['tabindex', '0'], ['role', 'group']]) as HTMLElement;
  const live = el(null, 'div', [['class', 'sp-live'], ['aria-live', 'polite']]);
  let marker: Element | null = null;
  let readoutBox: HTMLElement | null = null;

  const draw = (): void => {
    rendered = renderSpec(current, { id, width: current.width ?? (target.clientWidth || 480), forcedPrecision: forced?.matches ?? false });
    root.className = `sp-root sp-ground-${rendered.ground}`;
    root.setAttribute('data-substrate', rendered.substrate);
    root.setAttribute('data-chrome', rendered.chrome);
    root.setAttribute('data-status', rendered.status);
    root.setAttribute('aria-label', rendered.name);
    if (rendered.style) declare(root, rendered.style);
    const table = tableNode(rendered);
    root.replaceChildren(svgNode(rendered), live, ...(table ? [table] : []));
    paint();
  };
  const paint = (): void => {
    marker?.remove();
    readoutBox?.remove();
    marker = readoutBox = null;
    const r = active ? readout(rendered, active) : null;
    live.textContent = r ? r.announcement : '';
    if (!r) return;
    marker = el(SVG, 'svg', [['class', 'sp-marker'], ['viewBox', rendered.view.svg.viewBox], ['aria-hidden', 'true'], ['focusable', 'false']]);
    marker.append(el(SVG, 'path', [['d', r.marker.d]]));
    readoutBox = el(null, 'div', [['class', 'sp-readout'], ['aria-hidden', 'true']]) as HTMLElement;
    readoutBox.style.setProperty('left', String(r.left));
    readoutBox.style.setProperty('top', String(r.top));
    readoutBox.append(el(null, 'span', [['class', 'sp-readout-heading']], r.heading), document.createTextNode(r.text));
    root.insertBefore(marker, live);
    root.insertBefore(readoutBox, live);
  };
  const dispatch = (event: core.InteractionEvent): boolean => {
    const result = reduceInteraction(rendered.geometry, active, event);
    if (result.changed) {
      active = result.active;
      paint();
      target.dispatchEvent(new CustomEvent('sp-activechange', { bubbles: true, composed: true, detail: { active } }));
    }
    if (result.selected) target.dispatchEvent(new CustomEvent('sp-select', { bubbles: true, composed: true, detail: { selected: result.selected } }));
    return result.handled;
  };
  const pointer = (type: 'pointer' | 'click') => (event: PointerEvent | MouseEvent): void => {
    const svg = root.querySelector('svg.sp-chart');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    dispatch({ type, client: { x: event.clientX, y: event.clientY }, box: { left: box.left, top: box.top, width: box.width, height: box.height }, kind: ((event as PointerEvent).pointerType || 'mouse') as core.PointerKind });
  };
  const handlers: [string, EventListener][] = [
    ['pointermove', pointer('pointer') as EventListener],
    ['pointerdown', pointer('pointer') as EventListener],
    ['click', pointer('click') as EventListener],
    ['pointerleave', () => dispatch({ type: 'leave' })],
    ['focus', () => dispatch({ type: 'focus' })],
    ['blur', () => dispatch({ type: 'blur' })],
    ['keydown', ((e: KeyboardEvent) => { if (dispatch({ type: 'key', key: e.key })) e.preventDefault(); }) as EventListener],
  ];
  for (const [name, fn] of handlers) root.addEventListener(name, fn);
  const resize = typeof ResizeObserver === 'undefined' || spec.width !== undefined ? null : new ResizeObserver(() => draw());
  resize?.observe(target);
  const onForced = (): void => draw();
  forced?.addEventListener('change', onForced);
  draw();
  target.append(root);
  return {
    root,
    update(next) { current = next; draw(); },
    destroy() {
      for (const [name, fn] of handlers) root.removeEventListener(name, fn);
      resize?.disconnect();
      forced?.removeEventListener('change', onForced);
      root.remove();
    },
  };
}

function specOf(host: Element): ChartSpec | null {
  const json = host.querySelector(':scope > script[type="application/json"]');
  return json?.textContent ? (JSON.parse(json.textContent) as ChartSpec) : null;
}

const mounted = new WeakMap<Element, Handle>();
export function mountAll(scope: ParentNode = document): Handle[] {
  const out: Handle[] = [];
  for (const host of scope.querySelectorAll('[data-sp-embed]')) {
    if (mounted.has(host)) continue;
    const spec = specOf(host);
    if (!spec) continue;
    const handle = mount(host, spec, { fonts: 'embedded' });
    mounted.set(host, handle);
    out.push(handle);
  }
  return out;
}

export const ELEMENT_NAME = 'silverpoint-chart';
export function defineElement(): void {
  if (typeof customElements === 'undefined' || customElements.get(ELEMENT_NAME)) return;
  customElements.define(
    ELEMENT_NAME,
    class extends HTMLElement {
      private handle: Handle | null = null;
      private waiting: MutationObserver | null = null;
      connectedCallback(): void {
        if (this.handle || this.waiting) return;
        // Upgraded at its start tag while the parser has not reached its JSON child yet (PoC
        // finding F-P1): wait for the child instead of reading an empty element.
        if (!this.start()) {
          this.waiting = new MutationObserver(() => { if (this.start()) { this.waiting?.disconnect(); this.waiting = null; } });
          this.waiting.observe(this, { childList: true, subtree: true, characterData: true });
        }
      }
      private start(): boolean {
        const json = this.querySelector(':scope > script[type="application/json"]');
        if (!json?.textContent) return false;
        let spec: ChartSpec;
        try { spec = JSON.parse(json.textContent) as ChartSpec; } catch { return false; } // text still arriving
        this.handle = mount(this, { ...spec, ...(this.getAttribute('ground') ? { ground: this.getAttribute('ground') as string } : {}) }, { fonts: 'embedded' });
        return true;
      }
      disconnectedCallback(): void {
        this.waiting?.disconnect();
        this.waiting = null;
        this.handle?.destroy();
        this.handle = null;
      }
    },
  );
}
