/**
 * `generate_code` (API delta §3, REQ-541, REQ-547): the imports, the stylesheets and the code that
 * draw one chart or one component in one framework, from the catalog alone.
 */
import type { Catalog } from '../catalog';
import { emit } from './emit';
import { plan, type GenerateInput } from './plan';

export type { GenerateInput } from './plan';

export interface Generated {
  readonly imports: string[];
  readonly stylesheets: string[];
  readonly code: string;
  readonly notes: string[];
}

export function generateCode(catalog: Catalog, input: GenerateInput): Generated {
  const planned = plan(catalog, input);
  const { imports, code } = emit(planned);
  const notes = [...planned.notes];
  if (planned.framework === 'reflex') notes.unshift('`State` is a placeholder name: merge its fields into your own state class.');
  else if (planned.framework === 'angular') notes.unshift('Add the stylesheets to the `styles` array of angular.json.');
  return { imports, stylesheets: [...planned.stylesheets], code, notes };
}
