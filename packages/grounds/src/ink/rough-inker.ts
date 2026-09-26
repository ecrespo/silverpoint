import { round2, roundPathData, type Geometry, type Inker, type InkOptions, type Stroke, type Tile, type HatchToneSpec, type ToneLevel } from '@silverpoint/core';
import rough from 'roughjs';

/** Seeds live in [1, 2^31 - 2]: far enough from 0 and 2^32 that rough.js's own `seed + k` steps never wrap. */
const SEED_RANGE = 2 ** 31 - 2;

/**
 * Maps any seed into the range rough.js can use. rough.js treats a seed of 0 — or one whose
 * internal increment wraps to 0 modulo 2^32 — as "no seed" and falls back to `Math.random`,
 * which would break Art. 4.
 */
function safeSeed(seed: number): number {
  return 1 + (((Math.trunc(seed) % SEED_RANGE) + SEED_RANGE) % SEED_RANGE);
}

/** Rough.js options every inked stroke shares; `preserveVertices` is non-negotiable (Art. 1). */
function roughOptions(options: InkOptions, seed: number) {
  return {
    seed: safeSeed(seed),
    roughness: options.roughness,
    bowing: options.bowing,
    preserveVertices: true,
  };
}

function seedFor(options: InkOptions, index: number): number {
  return options.seed + index;
}

type Generator = ReturnType<typeof rough.generator>;

function pathsOf(generator: Generator, drawable: ReturnType<Generator['path']>): string {
  return generator
    .toPaths(drawable)
    .map((path) => path.d)
    .join(' ');
}

/** Lines per tile side: enough for hand variation inside the tile, few enough to stay light. */
function linesPerSide(gap: number): number {
  return Math.max(2, Math.round(48 / gap));
}

/**
 * One hatch tile for a tonal level (DD-007): parallel lines at the ramp's gap, crossed by a
 * perpendicular layer at level 4. Lines run edge to edge with preserved vertices, so tiles
 * join without seams.
 */
function buildTile(generator: Generator, id: string, spec: HatchToneSpec, options: InkOptions, seed: number): Tile {
  const count = linesPerSide(spec.gap);
  const size = spec.gap * count;
  const strokes: Stroke[] = [];
  const layers = spec.style === 'cross-hatch' ? 2 : 1;
  for (let layer = 0; layer < layers; layer += 1) {
    for (let k = 0; k < count; k += 1) {
      const at = spec.gap / 2 + k * spec.gap;
      const [x1, y1, x2, y2] = layer === 0 ? [0, at, size, at] : [at, 0, at, size];
      const drawable = generator.line(x1, y1, x2, y2, {
        ...roughOptions(options, seed + layer * count + k),
        disableMultiStroke: true,
      });
      strokes.push({ d: roundPathData(pathsOf(generator, drawable)), role: 'hatch', part: 'ink' });
    }
  }
  return { id, width: round2(size), height: round2(size), angle: round2(spec.angle), strokes };
}

function hatchPerShape(generator: Generator, shape: Stroke, spec: HatchToneSpec, options: InkOptions, seed: number): Stroke {
  const drawable = generator.path(shape.d, {
    ...roughOptions(options, seed),
    fill: 'hatch',
    stroke: 'none',
    fillStyle: spec.style,
    hachureGap: spec.gap,
    hachureAngle: spec.angle,
    fillWeight: options.fillWeight,
  });
  return { d: roundPathData(pathsOf(generator, drawable)), role: 'hatch', part: shape.part };
}

/**
 * Inks a geometry with rough.js (DD-002). Strokes that encode data are returned untouched
 * (Art. 1, REQ-022); ornament strokes are redrawn by hand with their vertices preserved; closed
 * shapes that carry a tone are hatched, by a tile shared per tonal level (REQ-029) or shape by
 * shape under `hatchFill: 'per-shape'`.
 */
function ink(geometry: Geometry, options: InkOptions): Geometry {
  const generator = rough.generator();
  const ramp = options.tonalRamp;
  const perShape = options.hatchFill === 'per-shape';
  const scope = options.scope ?? 'sp';
  const tiles = new Map<ToneLevel, Tile>();
  const strokes: Stroke[] = [];

  geometry.strokes.forEach((stroke, index) => {
    const seed = seedFor(options, index * 64);
    const step = stroke.tone && ramp ? ramp[stroke.tone as Exclude<ToneLevel, 0>] : undefined;
    // A weight step is not a hatch: this inker hatches only the steps it knows how to draw.
    const spec = step?.style === 'weight' ? undefined : step;
    if (spec && stroke.tone) {
      if (perShape) {
        strokes.push(hatchPerShape(generator, stroke, spec, options, seed));
      } else {
        const id = `${scope}-tone-${stroke.tone}`;
        if (!tiles.has(stroke.tone)) {
          tiles.set(stroke.tone, buildTile(generator, id, spec, options, seedFor(options, 1_000_003 * stroke.tone)));
        }
        strokes.push({ d: stroke.d, role: 'hatch', part: stroke.part, paint: 'tile', tile: id });
      }
    }
    if (stroke.role === 'ornament' && (stroke.paint ?? 'stroke') === 'stroke') {
      const drawable = generator.path(stroke.d, roughOptions(options, seed));
      strokes.push({ ...stroke, d: roundPathData(pathsOf(generator, drawable)) });
      return;
    }
    strokes.push(stroke);
  });

  const defs = [...geometry.defs, ...[...tiles.entries()].sort(([a], [b]) => a - b).map(([, tile]) => tile)];
  return { ...geometry, strokes, defs };
}

/** The `silverpoint` ground's inker, registered under the name its tokens declare. */
export const RoughInker: Inker = Object.freeze({ name: 'rough', ink });
