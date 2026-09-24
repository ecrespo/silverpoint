import type { ActiveItem, Geometry } from '../types';
import { resolveActive, stepActive, toSvgPoint, type PointerKind } from './hit-test';

type Point = Readonly<{ x: number; y: number }>;
type Box = Readonly<{ left: number; top: number; width: number; height: number }>;

/** A DOM event, reduced to the numbers the interaction engine needs. */
export type InteractionEvent =
  | { readonly type: 'pointer' | 'click'; readonly client: Point; readonly box: Box; readonly kind: PointerKind }
  | { readonly type: 'leave' | 'focus' | 'blur' }
  | { readonly type: 'key'; readonly key: string };

export interface InteractionResult {
  readonly active: ActiveItem | null;
  /** The active item differs from the current one: emit `activeChange` (REQ-141, REQ-143). */
  readonly changed: boolean;
  /** An item was chosen: emit `select` (API Spec §9). */
  readonly selected?: ActiveItem;
  /** The event was consumed; a key event should not scroll the page. */
  readonly handled: boolean;
}

/** Same item: same series and index. */
export function sameActive(a: ActiveItem | null, b: ActiveItem | null): boolean {
  return a === b || (a !== null && b !== null && a.seriesKey === b.seriesKey && a.index === b.index);
}

const SELECT_KEYS = ['Enter', ' '];

/**
 * The whole interaction of a chart as one pure function (REQ-140): current item plus event gives
 * the next item. Adapters wire DOM events to it and keep the result; they decide nothing.
 */
export function reduceInteraction(
  geometry: Geometry,
  current: ActiveItem | null,
  event: InteractionEvent,
): InteractionResult {
  const settle = (active: ActiveItem | null, extra: Partial<InteractionResult> = {}): InteractionResult => ({
    active,
    changed: !sameActive(current, active),
    handled: true,
    ...extra,
  });

  switch (event.type) {
    case 'pointer':
    case 'click': {
      const active = resolveActive(geometry, toSvgPoint(event.client, event.box, geometry.viewBox), event.kind);
      return event.type === 'click' && active ? settle(active, { selected: active }) : settle(active);
    }
    case 'leave':
    case 'blur':
      return settle(null);
    case 'focus':
      return settle(current ?? stepActive(geometry, null, 'Home') ?? null);
    case 'key': {
      if (SELECT_KEYS.includes(event.key)) {
        return current ? settle(current, { selected: current }) : { active: null, changed: false, handled: false };
      }
      const next = stepActive(geometry, current, event.key);
      return next === undefined ? { active: current, changed: false, handled: false } : settle(next);
    }
  }
}
