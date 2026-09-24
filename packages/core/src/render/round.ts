import type { Geometry, Rect, Stroke, Tile } from '../types';

/** Rounds to 2 decimals, the precision of every emitted coordinate (REQ-002). */
export function round2(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/** Rounds every number inside SVG path data to 2 decimals. */
export function roundPathData(d: string): string {
  return d.replace(NUMBER, (token) => String(round2(Number(token))));
}

function roundRect(rect: Rect): Rect {
  return {
    x: round2(rect.x),
    y: round2(rect.y),
    width: round2(rect.width),
    height: round2(rect.height),
  };
}

function roundStroke(stroke: Stroke): Stroke {
  return { ...stroke, d: roundPathData(stroke.d) };
}

function roundTile(tile: Tile): Tile {
  return {
    ...tile,
    width: round2(tile.width),
    height: round2(tile.height),
    angle: round2(tile.angle),
    strokes: tile.strokes.map(roundStroke),
  };
}

/** Rounds all coordinates of a geometry to 2 decimals, returning a new object (REQ-002). */
export function roundGeometry(geometry: Geometry): Geometry {
  return {
    viewBox: roundRect(geometry.viewBox),
    plot: roundRect(geometry.plot),
    strokes: geometry.strokes.map(roundStroke),
    labels: geometry.labels.map((label) => ({ ...label, x: round2(label.x), y: round2(label.y) })),
    hitAreas: geometry.hitAreas.map((hit) => ({
      ...hit,
      x: round2(hit.x),
      y: round2(hit.y),
      ...(hit.box ? { box: roundRect(hit.box) } : {}),
    })),
    defs: geometry.defs.map(roundTile),
  };
}
