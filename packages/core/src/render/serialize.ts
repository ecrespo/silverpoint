import type { Geometry } from '../types';

/** Serialises a geometry to JSON. Geometry holds no functions and no DOM nodes (REQ-011). */
export function serializeGeometry(geometry: Geometry): string {
  return JSON.stringify(geometry);
}

/** Inverse of `serializeGeometry`. */
export function parseGeometry(json: string): Geometry {
  return JSON.parse(json) as Geometry;
}

/** Bytes of path data a geometry carries, tiles included (NFR §7). */
export function pathBytes(geometry: Geometry): number {
  let bytes = 0;
  for (const stroke of geometry.strokes) bytes += stroke.d.length;
  for (const tile of geometry.defs) {
    for (const stroke of tile.strokes) bytes += stroke.d.length;
  }
  return bytes;
}

/** Path data budget per chart (API Spec §12). */
export const PATH_BYTE_BUDGET = 40_000;
