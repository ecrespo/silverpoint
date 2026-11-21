/**
 * `mount` (REQ-636, REQ-638..REQ-643, REQ-668; DD-064): a chart root under a target, drawn by the
 * one pipeline and bound to the core's interaction reducer, as the adapters' client chart is —
 * `create-chart.tsx` without React. Ids count mounts in document order (`sp-embed-<n>`).
 */
import { FORCED_PRECISION_QUERY, readout, reduceInteraction, sameActive, type ActiveItem, type Geometry, type InteractionEvent, type PointerKind } from '@silverpoint/core';
import type { Palette, PaletteName } from '@silverpoint/core/palettes';
import { toSVGString, type RenderedChart } from '@silverpoint/grounds';
import { GROUND_CSS } from '../render/assets.generated';
import { renderSpec } from '../render/render-spec';
import { errorDiagnostic } from '../spec/codes';
import type { ChartSpec, EmbedDiagnostic } from '../spec/types';
import { specErrorMessage, validateSpec } from '../spec/validate';
import { applyRoot, errorFigure, overlayNodes, sameTree, svgNode, tableNode } from './dom';
import { fontsFor } from './fonts';
import { adoptStyles } from './styles';

export interface AppearanceDefaults {
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: 'ink' | 'precision';
  readonly palette?: PaletteName | Palette;
}

export interface MountOptions {
  readonly onActiveChange?: (item: ActiveItem | null) => void;
  readonly onSelect?: (item: ActiveItem) => void;
  /** `console.warn` / `console.error` when absent, outside production. */
  readonly onDiagnostic?: (diagnostic: EmbedDiagnostic) => void;
  /** Defaults under the spec's own fields (the host's theme). */
  readonly appearance?: AppearanceDefaults;
  /** Default `'adopt'` (REQ-643). */
  readonly styles?: 'adopt' | 'none';
  /** Default `'embedded'` in a `full` file, `'none'` otherwise (REQ-647). */
  readonly fonts?: 'embedded' | 'none';
  readonly locale?: string;
}

export interface ChartMount {
  /** The chart root, or the error figure while the spec is invalid. */
  readonly element: HTMLElement;
  update(spec: ChartSpec | string, options?: Pick<MountOptions, 'appearance'>): void;
  /** `null` while showing the error figure. */
  getGeometry(): Geometry | null;
  /** Canonical markup; with `standalone`, the ground's stylesheet inside it. */
  toSVGString(options?: { readonly standalone?: boolean }): string;
  destroy(): void;
}

/** Where the root goes when it is not the target itself (the element's shadow root, DD-070). */
export interface MountPlacement {
  readonly into?: Element | ShadowRoot;
}

let mounts = 0;
/** Targets with a live mount: `mountAll` skips them (REQ-646). */
export const MOUNTED = new WeakMap<Element, ChartMount>();

const SERVER_ROOT = ':scope > .sp-root';

function withAppearance(spec: ChartSpec | string, appearance: AppearanceDefaults | undefined): ChartSpec | string {
  if (!appearance || typeof spec === 'string') return spec;
  return { ...appearance, ...spec } as ChartSpec;
}

/** Applies appearance defaults to a JSON string spec too, once it parses. */
function resolve(spec: ChartSpec | string, appearance: AppearanceDefaults | undefined): ChartSpec | string {
  if (typeof spec !== 'string' || !appearance) return withAppearance(spec, appearance);
  const valid = validateSpec(spec);
  return valid.ok ? withAppearance(valid.value, appearance) : spec;
}

export function mount(target: Element, spec: ChartSpec | string, options: MountOptions & MountPlacement = {}): ChartMount {
  const document = target.ownerDocument;
  const container = options.into ?? target;
  let appearance = options.appearance;
  let current = spec;
  let active: ActiveItem | null = null;
  let rendered: RenderedChart | null = null;
  let measured: number | undefined;
  let figure: Element | null = null;

  // A server-rendered root is adopted when it equals what would be built (DD-070, A-02).
  const server = container instanceof Element ? container.querySelector<HTMLElement>(SERVER_ROOT) : (container.querySelector(':scope > .sp-root') as HTMLElement | null);
  const serverId = server?.querySelector('svg.sp-chart > title')?.id.replace(/-title$/, '');
  const id = serverId || `sp-embed-${++mounts}`;
  const root: HTMLElement = server ?? (document.createElement('div') as HTMLElement);
  let adoptedServer = server !== null;

  const live = (): HTMLElement => {
    let node = root.querySelector<HTMLElement>(':scope > .sp-live');
    if (!node) {
      node = document.createElement('div');
      node.setAttribute('class', 'sp-live');
      node.setAttribute('aria-live', 'polite');
    }
    return node;
  };

  if (options.styles !== 'none') adoptStyles(container instanceof Element ? container : container.host, fontsFor(options.fonts));
  if (container instanceof ShadowRoot && options.styles !== 'none') adoptStyles(container.firstChild ?? container.appendChild(document.createComment('silverpoint')), fontsFor(options.fonts));

  const report = (diagnostic: EmbedDiagnostic): void => {
    if (options.onDiagnostic) options.onDiagnostic(diagnostic);
    else if (process.env.NODE_ENV !== 'production') (diagnostic.severity === 'error' ? console.error : console.warn)(diagnostic.message);
    target.dispatchEvent(new CustomEvent('sp-diagnostic', { bubbles: true, composed: true, detail: diagnostic }));
  };

  const forced = typeof matchMedia === 'function' ? matchMedia(FORCED_PRECISION_QUERY) : null;

  const paint = (): void => {
    if (!rendered) return;
    for (const old of root.querySelectorAll(':scope > svg.sp-marker, :scope > .sp-readout')) old.remove();
    const region = live();
    const now = active ? readout(rendered, active) : null;
    region.textContent = now ? now.announcement : '';
    if (now) for (const node of overlayNodes(document, rendered, now)) root.insertBefore(node, region);
    syncEscape();
  };

  const draw = (): void => {
    const result = renderSpec(resolve(current, appearance), {
      id,
      ...(measured === undefined ? {} : { width: measured }),
      forcedPrecision: forced?.matches ?? false,
      ...(options.locale === undefined ? {} : { locale: options.locale }),
    });
    for (const diagnostic of result.diagnostics) report(diagnostic);
    if (!result.ok) {
      const parsed = typeof current === 'string' ? undefined : current.chart;
      const message = specErrorMessage(result.error, parsed);
      rendered = null;
      active = null;
      root.remove();
      figure?.remove();
      figure = errorFigure(document, message);
      container.append(figure);
      target.setAttribute('data-sp-embed-state', 'error');
      report(errorDiagnostic('SP031', parsed ?? 'spec', 'spec', message));
      syncEscape();
      return;
    }
    figure?.remove();
    figure = null;
    const previous = active;
    rendered = result.value;
    if (adoptedServer) {
      // Adopt only if the server's tree is the one this mount would build.
      const probe = document.createElement('div');
      applyRoot(probe, rendered);
      probe.append(svgNode(document, rendered));
      probe.append(live());
      const table = tableNode(document, rendered);
      if (table) probe.append(table);
      if (!sameTree(probe, root)) {
        adoptedServer = false;
        for (const attr of [...root.attributes]) root.removeAttribute(attr.name);
        root.replaceChildren();
      }
    }
    if (!adoptedServer) {
      applyRoot(root, rendered);
      const region = live();
      const table = tableNode(document, rendered);
      root.replaceChildren(svgNode(document, rendered), region, ...(table ? [table] : []));
    }
    adoptedServer = false;
    // REQ-642: the active item stays where an item with the same series and index still exists.
    const kept = previous ? rendered.geometry.hitAreas.find((hit) => sameActive({ ...previous, seriesKey: hit.seriesKey, index: hit.index }, previous)) : undefined;
    active = kept ? { seriesKey: kept.seriesKey, index: kept.index, datum: kept.datum, value: kept.value, point: { x: kept.x, y: kept.y } } : null;
    if (!root.isConnected || root.parentNode !== container) container.append(root);
    target.setAttribute('data-sp-embed', '');
    target.setAttribute('data-sp-embed-state', 'mounted');
    paint();
  };

  const dispatch = (event: InteractionEvent): boolean => {
    if (!rendered) return false;
    const result = reduceInteraction(rendered.geometry, active, event);
    if (result.changed) {
      active = result.active;
      paint();
      options.onActiveChange?.(active);
      target.dispatchEvent(new CustomEvent('sp-activechange', { bubbles: true, composed: true, detail: active }));
    }
    if (result.selected) {
      options.onSelect?.(result.selected);
      target.dispatchEvent(new CustomEvent('sp-select', { bubbles: true, composed: true, detail: result.selected }));
    }
    return result.handled;
  };

  // WCAG 1.4.13: a readout shown by the pointer is dismissible with Escape wherever focus is.
  const onDocumentKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !root.contains(event.target as Node)) dispatch({ type: 'key', key: 'Escape' });
  };
  let escapeBound = false;
  function syncEscape(): void {
    const showing = active !== null;
    if (showing && !escapeBound) document.addEventListener('keydown', onDocumentKey);
    if (!showing && escapeBound) document.removeEventListener('keydown', onDocumentKey);
    escapeBound = showing;
  }

  const pointer = (type: 'pointer' | 'click') => (event: Event): void => {
    const svg = root.querySelector('svg.sp-chart');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const e = event as PointerEvent;
    dispatch({ type, client: { x: e.clientX, y: e.clientY }, box: { left: box.left, top: box.top, width: box.width, height: box.height }, kind: (e.pointerType || 'mouse') as PointerKind });
  };
  const listeners: [string, EventListener][] = [
    ['pointermove', pointer('pointer')],
    ['pointerdown', pointer('pointer')],
    ['click', pointer('click')],
    ['pointerleave', () => void dispatch({ type: 'leave' })],
    ['focus', () => void dispatch({ type: 'focus' })],
    ['blur', () => void dispatch({ type: 'blur' })],
    ['keydown', ((event: KeyboardEvent) => {
      if (dispatch({ type: 'key', key: event.key })) event.preventDefault();
    }) as EventListener],
  ];
  for (const [name, listener] of listeners) root.addEventListener(name, listener);

  const fixedWidth = (): boolean => {
    const resolved = resolve(current, appearance);
    return typeof resolved !== 'string' && resolved.width !== undefined;
  };
  const measure = (): void => {
    const width = target instanceof HTMLElement ? target.clientWidth : 0;
    measured = width > 0 ? width : undefined;
  };
  if (!fixedWidth()) measure();
  // REQ-640: a hidden container is not a measurement; the last width stands and nothing is raised.
  const resize =
    typeof ResizeObserver === 'function' && !fixedWidth()
      ? new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry || fixedWidth()) return;
          if (entry.contentRect.width > 0 || root.getClientRects().length > 0) {
            if (entry.contentRect.width !== measured && entry.contentRect.width > 0) {
              measured = entry.contentRect.width;
              draw();
            }
          }
        })
      : null;
  const onForced = (): void => draw();
  forced?.addEventListener?.('change', onForced);

  draw();
  resize?.observe(root);

  const handle: ChartMount = {
    get element() {
      return (figure as HTMLElement | null) ?? root;
    },
    update(next, more) {
      current = next;
      if (more?.appearance) appearance = more.appearance;
      draw();
    },
    getGeometry: () => rendered?.geometry ?? null,
    toSVGString(more) {
      if (!rendered) return '';
      const markup = toSVGString(rendered);
      if (!more?.standalone) return markup;
      const open = markup.indexOf('>') + 1;
      return `${markup.slice(0, open)}<style>${GROUND_CSS}</style>${markup.slice(open)}`;
    },
    destroy() {
      for (const [name, listener] of listeners) root.removeEventListener(name, listener);
      if (escapeBound) document.removeEventListener('keydown', onDocumentKey);
      escapeBound = false;
      resize?.disconnect();
      forced?.removeEventListener?.('change', onForced);
      root.remove();
      figure?.remove();
      target.removeAttribute('data-sp-embed-state');
      MOUNTED.delete(target);
    },
  };
  MOUNTED.set(target, handle);
  return handle;
}
