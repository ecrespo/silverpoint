import type { ChartModel, InkMode, Stroke, StrokePaint, TextLabel } from '../types';

/**
 * The SVG a chart renders, as flat element descriptors with every attribute value already a
 * string. Each adapter's template writes these fields to the same attribute names, one to one,
 * and computes nothing (Art. 2); `svgString` writes them too, and its output is the canonical
 * render every adapter is compared against (Art. 3, DD-004).
 *
 * Colour never appears here: the stylesheet paints by `part` (REQ-042).
 */
export interface SvgView {
  readonly svg: Readonly<{
    viewBox: string;
    width: string;
    height: string;
    /** `class` attribute. */
    class: string;
    /** `data-substrate` attribute. */
    substrate: string;
    /** `data-mode` attribute. */
    mode: InkMode;
    role: 'img';
    /** `aria-labelledby` attribute. */
    labelledby: string;
  }>;
  readonly title: Readonly<{ id: string; text: string }>;
  readonly desc: Readonly<{ id: string; text: string }>;
  /** `<pattern>` elements inside `<defs>`; `<defs>` is omitted when there are none. */
  readonly patterns: readonly PatternView[];
  readonly paths: readonly PathView[];
  readonly texts: readonly TextView[];
}

export interface PatternView {
  readonly id: string;
  readonly width: string;
  readonly height: string;
  /** `patternTransform` attribute. */
  readonly transform: string;
  readonly paths: readonly PathView[];
}

export interface PathView {
  readonly d: string;
  /** `part` attribute: `sp-<part>`. */
  readonly part: string;
  /** `data-role` attribute. */
  readonly role: Stroke['role'];
  /** `data-paint` attribute. */
  readonly paint: StrokePaint;
  /** `data-dash` attribute, omitted when `null`. */
  readonly dash: string | null;
  /** `data-weight` attribute: a `weight` ground's tonal level (REQ-028), omitted when `null`. */
  readonly weight: string | null;
  /** `fill` attribute — only ever a `url(#tile)` reference, omitted when `null`. */
  readonly fill: string | null;
}

export interface TextView {
  readonly x: string;
  readonly y: string;
  /** `part` attribute: `sp-text` or `sp-axis`. */
  readonly part: string;
  /** `data-kind` attribute. */
  readonly kind: TextLabel['kind'];
  /** `text-anchor` attribute. */
  readonly anchor: TextLabel['anchor'];
  readonly text: string;
}

export interface ViewStyle {
  readonly ground: string;
  readonly substrate: string;
  readonly mode: InkMode;
}

function pathView(stroke: Stroke): PathView {
  const paint = stroke.paint ?? 'stroke';
  return {
    d: stroke.d,
    part: `sp-${stroke.part}`,
    role: stroke.role,
    paint,
    dash: stroke.dash ?? null,
    weight: stroke.weight === undefined ? null : String(stroke.weight),
    fill: paint === 'tile' && stroke.tile ? `url(#${stroke.tile})` : null,
  };
}

/** Builds the element descriptors of a chart model (API Spec §10). */
export function toSvgView(model: ChartModel, style: ViewStyle): SvgView {
  const { geometry, ids } = model;
  const { viewBox } = geometry;
  return {
    svg: {
      viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
      width: String(viewBox.width),
      height: String(viewBox.height),
      class: `sp-chart sp-ground-${style.ground}`,
      substrate: style.substrate,
      mode: style.mode,
      role: 'img',
      labelledby: `${ids.title} ${ids.desc}`,
    },
    title: { id: ids.title, text: model.name },
    desc: { id: ids.desc, text: model.description },
    patterns: geometry.defs.map((tile) => ({
      id: tile.id,
      width: String(tile.width),
      height: String(tile.height),
      transform: `rotate(${tile.angle})`,
      paths: tile.strokes.map(pathView),
    })),
    paths: geometry.strokes.map(pathView),
    texts: geometry.labels.map((label) => ({
      x: String(label.x),
      y: String(label.y),
      part: `sp-${label.part}`,
      kind: label.kind,
      anchor: label.anchor,
      text: label.text,
    })),
  };
}

const ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escape(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char);
}

function attributes(pairs: readonly (readonly [string, string | null])[]): string {
  return pairs
    .filter((pair): pair is readonly [string, string] => pair[1] !== null)
    .map(([name, value]) => ` ${name}="${escape(value)}"`)
    .join('');
}

function pathString(path: PathView): string {
  return `<path${attributes([
    ['d', path.d],
    ['part', path.part],
    ['data-role', path.role],
    ['data-paint', path.paint],
    ['data-dash', path.dash],
    ['data-weight', path.weight],
    ['fill', path.fill],
  ])}></path>`;
}

/**
 * Serialises a view to SVG markup. This is the canonical render stored with each fixture;
 * user text is always escaped, never interpolated as markup (TD §6).
 */
export function svgString(view: SvgView): string {
  const { svg } = view;
  const open = `<svg${attributes([
    ['xmlns', 'http://www.w3.org/2000/svg'],
    ['viewBox', svg.viewBox],
    ['width', svg.width],
    ['height', svg.height],
    ['class', svg.class],
    ['data-substrate', svg.substrate],
    ['data-mode', svg.mode],
    ['role', svg.role],
    ['aria-labelledby', svg.labelledby],
  ])}>`;
  const title = `<title id="${escape(view.title.id)}">${escape(view.title.text)}</title>`;
  const desc = `<desc id="${escape(view.desc.id)}">${escape(view.desc.text)}</desc>`;
  const defs =
    view.patterns.length === 0
      ? ''
      : `<defs>${view.patterns
          .map(
            (pattern) =>
              `<pattern${attributes([
                ['id', pattern.id],
                ['width', pattern.width],
                ['height', pattern.height],
                ['patternUnits', 'userSpaceOnUse'],
                ['patternTransform', pattern.transform],
              ])}>${pattern.paths.map(pathString).join('')}</pattern>`,
          )
          .join('')}</defs>`;
  const paths = view.paths.map(pathString).join('');
  const texts = view.texts
    .map(
      (text) =>
        `<text${attributes([
          ['x', text.x],
          ['y', text.y],
          ['part', text.part],
          ['data-kind', text.kind],
          ['text-anchor', text.anchor],
        ])}>${escape(text.text)}</text>`,
    )
    .join('');
  return `${open}${title}${desc}${defs}${paths}${texts}</svg>`;
}
