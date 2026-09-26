import { diagnose } from '../diagnostics/diagnose';
import type { ChartModel } from '../types';

/**
 * The items of `model` whose datum carries `value` under `key` (REQ-216), by the index of their hit
 * area: exact matches only, never the nearest (REQ-217). A chart whose data has no `key` at all
 * shows no linked mark and warns SP016, once. Pure: the model is read, never touched.
 */
export function linkedItems(model: ChartModel, key: string, value: unknown): readonly number[] {
  const { hitAreas } = model.geometry;
  if (hitAreas.length > 0 && !hitAreas.some((hit) => key in hit.datum) && process.env.NODE_ENV !== 'production') {
    diagnose('SP016', model.chart, { property: 'link.key', message: `No datum has a "${key}" field.` });
  }
  return hitAreas.flatMap((hit, index) => (hit.datum[key] === value ? [index] : []));
}
