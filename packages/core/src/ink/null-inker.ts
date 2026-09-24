import type { Geometry, Inker, InkOptions } from '../types';

/** Returns the geometry untouched and uncopied. `precision` mode is exactly this (REQ-021). */
export const NullInker: Inker = Object.freeze({
  name: 'null',
  ink(geometry: Geometry, _options: InkOptions): Geometry {
    return geometry;
  },
});
