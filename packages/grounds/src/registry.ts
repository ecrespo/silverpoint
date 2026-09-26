import { diagnose, type Ground, type GroundRef } from '@silverpoint/core';
import { cyanotype } from './cyanotype/ground';
import { silverpoint } from './silverpoint/ground';

const registry = new Map<string, Ground>([
  [silverpoint.name, silverpoint],
  [cyanotype.name, cyanotype],
]);

/** Registers a ground under its `name`. A declarative call that touches no chart (REQ-044). */
export function registerGround(ground: Ground): void {
  registry.set(ground.name, ground);
}

/**
 * Resolves a ground reference. A complete ground is used as given; an unknown name falls back
 * to `silverpoint` and emits SP007, and the render continues (REQ-045).
 */
export function resolveGround(ref: GroundRef, chart: string): Ground {
  if (typeof ref !== 'string') return ref;
  const found = registry.get(ref);
  if (found) return found;
  if (process.env.NODE_ENV !== 'production') {
    diagnose('SP007', chart, { property: 'ground', message: `Ground "${ref}" is not registered.` });
  }
  return silverpoint;
}
