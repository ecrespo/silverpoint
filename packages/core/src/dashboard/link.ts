import { diagnose } from '../diagnostics/diagnose';
import { readout, toActiveItem } from '../interaction/hit-test';
import type { ActiveItem, ChartModel } from '../types';

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

/** A dashboard's linked value (REQ-216): the key, the value of the source's active item, and the source chart's id. */
export interface LinkState {
  readonly key: string;
  readonly value: unknown;
  readonly source: string;
}

/** The link a chart's active item sets; `null` when it clears, which clears every chart (REQ-218). */
export function linkFrom(key: string, source: string, active: ActiveItem | null): LinkState | null {
  return active ? { key, value: active.datum[key], source } : null;
}

/**
 * The marker paths a chart draws for a link (REQ-216): the readout's own marker, for each item
 * carrying the value. None for the source, which shows its active item, nor for a cleared link.
 */
export function linkedMarks(model: Pick<ChartModel, 'id' | 'chart' | 'geometry' | 'table'>, state: LinkState | null | undefined): readonly string[] {
  if (!state || state.source === model.id) return [];
  return linkedItems(model as ChartModel, state.key, state.value).map((index) => readout(model, toActiveItem(model.geometry.hitAreas[index]!)).marker.d);
}
