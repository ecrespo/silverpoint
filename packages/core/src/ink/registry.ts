import { diagnose } from '../diagnostics/diagnose';
import type { Inker } from '../types';
import { NullInker } from './null-inker';

const registry = new Map<string, Inker>([[NullInker.name, NullInker]]);

/** Registers an inker under its `name`, replacing any previous one with that name. */
export function registerInker(inker: Inker): void {
  registry.set(inker.name, inker);
}

/**
 * Resolves an inker by name among the registered ones and `builtins`. An unknown name falls
 * back to `NullInker` and emits SP006; the render continues (REQ-026).
 */
export function resolveInker(name: string, chart: string, builtins: readonly Inker[] = []): Inker {
  const found = registry.get(name) ?? builtins.find((inker) => inker.name === name);
  if (found) return found;
  if (process.env.NODE_ENV !== 'production') {
    diagnose('SP006', chart, { property: 'inker', message: `Inker "${name}" is not registered.` });
  }
  return NullInker;
}
