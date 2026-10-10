/**
 * T-187 · the controlled root (REQ-439, REQ-108): what `onRootChange` carries when a node of a
 * `SunburstChart` or a `SquarifiedTreemap` is activated. The adapters map their `select` to it with
 * this one function, so the three emit the same id and none of them holds the root (I-30).
 */
import { describe, expect, test } from 'vitest';
import { reduceInteraction, stepActive, type ActiveItem, type ChartModel } from '../src';
import { rootChangeOf, squarifiedTreemap, sunburstChart } from '../src/catalog';
import { context } from './support/second-catalog-contract';

const drawnRoot = (model: ChartModel) => stepActive(model.geometry, null, 'Home') as ActiveItem;
const activate = (model: ChartModel, item: ActiveItem) => reduceInteraction(model.geometry, item, { type: 'key', key: 'Enter' }).selected as ActiveItem;
const child = (model: ChartModel) => stepActive(model.geometry, drawnRoot(model), 'ArrowDown') as ActiveItem;

describe.each([
  ['SquarifiedTreemap', squarifiedTreemap],
  ['SunburstChart', sunburstChart],
] as const)('%s · rootChangeOf (T-187)', (_name, recipe) => {
  test('REQ-439 · activating a node emits its id', () => {
    const model = recipe.build({}, context);
    const node = child(model);
    expect(rootChangeOf(model.geometry, activate(model, node))).toBe((node.datum as { id: string }).id);
  });

  test('REQ-439 · activating the drawn root emits its parent; the data root’s child returns null', () => {
    const drilled = recipe.build({ rootId: 'works-01' }, context);
    expect(rootChangeOf(drilled.geometry, activate(drilled, drawnRoot(drilled)))).toBe('works');
    const first = recipe.build({ rootId: 'works' }, context);
    expect(rootChangeOf(first.geometry, activate(first, drawnRoot(first)))).toBeNull();
  });

  test('REQ-439 · activating the data root itself emits null: there is nothing above it', () => {
    const model = recipe.build({}, context);
    expect(rootChangeOf(model.geometry, activate(model, drawnRoot(model)))).toBeNull();
  });

  test('REQ-108 · I-30 · the emitted id, fed back as rootId, draws that node as the root', () => {
    const model = recipe.build({}, context);
    const id = rootChangeOf(model.geometry, activate(model, child(model)));
    const next = recipe.build({ rootId: id }, context);
    expect((drawnRoot(next).datum as { id: string }).id).toBe(id);
    expect(rootChangeOf(next.geometry, activate(next, drawnRoot(next)))).toBeNull();
  });
});

describe('the item after a redraw (T-187)', () => {
  test('REQ-439 · the id is read from the geometry as drawn now, not from the item as it was', () => {
    // The drawn root of the old geometry is still active when the consumer passes the new root back:
    // the shared reducer keeps an item by its place, so the drill reads that place in the new drawing.
    const before = squarifiedTreemap.build({ rootId: 'works-01' }, context);
    const stale = drawnRoot(before);
    const after = squarifiedTreemap.build({ rootId: 'works' }, context);
    const chosen = reduceInteraction(after.geometry, stale, { type: 'key', key: 'Enter' }).selected as ActiveItem;
    expect(rootChangeOf(before.geometry, chosen)).toBe('works');
    expect(rootChangeOf(after.geometry, chosen)).toBeNull();
  });
});
