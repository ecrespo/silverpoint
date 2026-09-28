import { fnv1a32, PATH_BYTE_BUDGET, resolveInker, type Geometry, type Ground, type Stroke } from '@silverpoint/core';
import { resolveUiTokens, UI_FRAME_KINDS, uiFrameOutline, uiToneTile, type UiFrameKind } from '@silverpoint/core/ui';
import { RoughInker } from '../ink/rough-inker';
import { WeightInker } from '../ink/weight-inker';

/**
 * The build half of DD-022: the core's exact frame outlines and tone tiles, drawn once per ground
 * and variant by the ground's own inker, and written as SVG mask images for `ui.css`. Nothing here
 * runs at render time; it reads no clock and no randomness, only fixed seeds (Art. 4).
 */

/** A piece of the 9-slice frame: four corners and four edges, or one whole piece. */
export type UiPieceName = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'all';

export interface UiFramePieces {
  readonly kind: UiFrameKind;
  readonly variant: number;
  readonly slice: number;
  readonly pieces: Readonly<Partial<Record<UiPieceName, string>>>;
}

export interface UiTonePiece {
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

/** The mask stroke widths, in CSS px at 1:1: a frame's hairline, and a finer hatch (as for charts). */
const FRAME_WIDTH = 1;
const HATCH_WIDTH = 0.6;

/** Kinds that frame fixed-size squares are laid whole; the others are cut (DD-022). */
const WHOLE: ReadonlySet<UiFrameKind> = new Set(['box', 'round']);

function ink(ground: Ground, geometry: Geometry, seed: number): Geometry {
  const inker = resolveInker(ground.inker, 'ui.css', [RoughInker, WeightInker]);
  return inker.ink(geometry, { seed, ...ground.inkOptions, nodeBudget: PATH_BYTE_BUDGET, tonalRamp: ground.tonalRamp });
}

function svg(viewBox: string, strokes: readonly Stroke[], width: number, stretch: boolean): string {
  const paths = strokes
    .map((s) => `<path d="${s.d}" fill="none" stroke="black" stroke-width="${width}" stroke-linecap="round"/>`)
    .join('');
  const aspect = stretch ? ' preserveAspectRatio="none"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${aspect}>${paths}</svg>`;
}

/**
 * One frame kind of one ground in one variant, drawn by the ground's inker with a seed fixed by
 * ground, kind and variant, and cut into windows on that one drawing: corners at their size, edges
 * stretched along their own axis only, so a horizontal edge keeps its line's thickness. `null` for
 * a ground whose frame is `css`: it draws an exact border and needs no piece.
 */
export function uiFramePieces(ground: Ground, kind: UiFrameKind, variant: number): UiFramePieces | null {
  if (resolveUiTokens(ground).frame !== 'inked') return null;
  const { size, slice } = UI_FRAME_KINDS[kind];
  const drawn = ink(ground, uiFrameOutline(kind), fnv1a32(`${ground.name}:${kind}:${variant}`)).strokes;
  if (WHOLE.has(kind)) {
    return { kind, variant, slice, pieces: { all: svg(`0 0 ${size} ${size}`, drawn, FRAME_WIDTH, false) } };
  }
  const far = size - slice;
  const mid = size - 2 * slice;
  const windows: Record<Exclude<UiPieceName, 'all'>, [string, boolean]> = {
    tl: [`0 0 ${slice} ${slice}`, false],
    t: [`${slice} 0 ${mid} ${slice}`, true],
    tr: [`${far} 0 ${slice} ${slice}`, false],
    r: [`${far} ${slice} ${slice} ${mid}`, true],
    br: [`${far} ${far} ${slice} ${slice}`, false],
    b: [`${slice} ${far} ${mid} ${slice}`, true],
    bl: [`0 ${far} ${slice} ${slice}`, false],
    l: [`0 ${slice} ${slice} ${mid}`, true],
  };
  const pieces = Object.fromEntries(Object.entries(windows).map(([name, [box, stretch]]) => [name, svg(box, drawn, FRAME_WIDTH, stretch)]));
  return { kind, variant, slice, pieces };
}

/**
 * The tone of one ramp step of a `hatch` ground: the core's seamless tile layers (one, or two for
 * cross-hatch), drawn by the ground's inker. A `weight` ground has none: its tone is line weight.
 */
export function uiTonePieces(ground: Ground, level: 1 | 2 | 3 | 4): readonly UiTonePiece[] {
  if (ground.tonalMechanism !== 'hatch') return [];
  return uiToneTile(ground.tonalRamp[level]).map((layer, i) => {
    const box = { x: 0, y: 0, width: layer.width, height: layer.height };
    const geometry: Geometry = { viewBox: box, plot: box, strokes: layer.strokes, labels: [], hitAreas: [], defs: [] };
    const drawn = ink(ground, geometry, fnv1a32(`${ground.name}:tone:${level}:${i}`)).strokes;
    return { width: layer.width, height: layer.height, svg: svg(`0 0 ${layer.width} ${layer.height}`, drawn, HATCH_WIDTH, false) };
  });
}

/** A mask image as a CSS `url()`: URL-encoded, not base64, so gzip still sees the repeated paths. */
export function svgDataUri(svg: string): string {
  const body = svg.replaceAll('"', "'").replace(/[#%<>]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `url("data:image/svg+xml,${body}")`;
}
