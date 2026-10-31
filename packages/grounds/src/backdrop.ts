/**
 * A slide's inked backdrop (DD-055, REQ-587, Data Model §2.36): the substrate, and under `hatched`
 * a 32 px band of the ground's tonal level 1, under `plate` a double rule 24 and 30 px inside the
 * edge — drawn by the ground's own inker (`NullInker` in `precision`), seeded (Art. 4). It is a
 * standalone SVG for a CSS data URI, so it carries the ground's colours as attributes: no page
 * stylesheet reaches it. Every colour is a ground token (Art. 7).
 */
import { NullInker, PATH_BYTE_BUDGET, resolveInker, round2, roundGeometry, type Geometry, type GroundRef, type InkMode, type Stroke, type Tile } from '@silverpoint/core';
import { RoughInker } from './ink/rough-inker';
import { WeightInker } from './ink/weight-inker';
import { resolveGround } from './registry';

export interface SlideBackdropOptions {
  readonly kind: 'plain' | 'hatched' | 'plate';
  /** `resolveSeed(`${deckId}-s${n}`)`. */
  readonly seed: number;
  readonly mode: InkMode;
  readonly width: number;
  readonly height: number;
}

export interface SlideBackdrop {
  readonly svg: string;
  /** `data:image/svg+xml,` + the SVG, percent-encoded. */
  readonly dataUri: string;
}

/** The stylesheet's `--sp-stroke-width` (styles.css), which no data URI can read. */
export const BACKDROP_STROKE_WIDTH = 0.9;
/** Hatching is finer than the outline, as in the stylesheet (`[data-role='hatch']`). */
const HATCH_RATIO = 0.6;
const BAND = 32;
const PLATE = [24, 30] as const;
const SCOPE = 'sp-backdrop';

const escape = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rect = (inset: number, width: number, height: number): string => `M${inset} ${inset}H${width - inset}V${height - inset}H${inset}Z`;

function shapes(kind: SlideBackdropOptions['kind'], mode: InkMode, width: number, height: number): Stroke[] {
  if (kind === 'plate') return PLATE.map((inset) => ({ d: rect(inset, width, height), role: 'ornament', part: 'rule' }));
  if (kind === 'hatched') {
    // One shape, the inner edge wound the other way, so a tile fills the band and not the slide.
    const d = `M0 0H${width}V${height}H0ZM${BAND} ${BAND}V${height - BAND}H${width - BAND}V${BAND}Z`;
    return [{ d, role: 'ornament', part: 'ink-secondary', tone: 1, paint: mode === 'precision' ? 'stroke' : 'none' }];
  }
  return [];
}

export function slideBackdrop(groundRef: GroundRef, substrate: string, options: SlideBackdropOptions): SlideBackdrop {
  const ground = resolveGround(groundRef, 'slideBackdrop');
  const { width, height, mode } = options;
  const fill = ground.substrates[substrate] ?? Object.values(ground.substrates)[0]!;
  const colour = (part: Stroke['part']): string =>
    ({ ink: ground.ink.primary, 'ink-secondary': ground.ink.secondary, heighten: ground.ink.heighten, rule: ground.ink.rule, grid: ground.ink.grid, axis: ground.ink.textMuted })[part];

  const exact: Geometry = { viewBox: { x: 0, y: 0, width, height }, strokes: shapes(options.kind, mode, width, height), labels: [], hitAreas: [], defs: [], plot: { x: 0, y: 0, width, height } };
  const inker = mode === 'precision' ? NullInker : resolveInker(ground.inker, 'slideBackdrop', [RoughInker, WeightInker]);
  const inked = roundGeometry(
    inker.ink(exact, { seed: options.seed, ...ground.inkOptions, nodeBudget: PATH_BYTE_BUDGET, hatchFill: 'tile', tonalRamp: ground.tonalRamp, scope: SCOPE }),
  );

  const widthOf = (stroke: Stroke): number => {
    const step = stroke.tonalWeight === undefined ? undefined : ground.tonalRamp[stroke.tonalWeight];
    if (step?.style === 'weight') return round2(BACKDROP_STROKE_WIDTH * step.weight);
    return stroke.role === 'hatch' ? round2(BACKDROP_STROKE_WIDTH * HATCH_RATIO) : BACKDROP_STROKE_WIDTH;
  };
  const path = (stroke: Stroke): string => {
    const paint = stroke.paint ?? 'stroke';
    if (paint === 'none') return '';
    if (paint === 'tile') return `<path d="${stroke.d}" fill="url(#${escape(stroke.tile ?? '')})" stroke="none"/>`;
    if (paint === 'fill') return `<path d="${stroke.d}" fill="${escape(colour(stroke.part))}" stroke="none"/>`;
    return `<path d="${stroke.d}" fill="none" stroke="${escape(colour(stroke.part))}" stroke-width="${widthOf(stroke)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const pattern = (tile: Tile): string =>
    `<pattern id="${escape(tile.id)}" width="${tile.width}" height="${tile.height}" patternUnits="userSpaceOnUse" patternTransform="rotate(${tile.angle})">${tile.strokes.map(path).join('')}</pattern>`;

  const defs = inked.defs.length === 0 ? '' : `<defs>${inked.defs.map(pattern).join('')}</defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${escape(fill)}"/>${defs}${inked.strokes.map(path).join('')}</svg>`;
  return { svg, dataUri: `data:image/svg+xml,${encodeURIComponent(svg)}` };
}
