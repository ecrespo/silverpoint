/**
 * What every adapter runs once its deck is in the DOM (REQ-593, REQ-610, REQ-611): scaling, the
 * bindings, the fragments of the current slide, and the charts of the hydration plan, mounted by
 * the adapter's own mechanism. One cleanup undoes all of it; an adapter calls it before a re-render
 * of new Markdown and on unmount.
 */
import type { DeckController } from '../controller';
import type { HydrationEntry } from '../hydration';
import { bindDeck, type BindOptions } from './bind';
import { applyFragments, applyScaling } from './dom';

export interface DeckHydration {
  readonly plan: readonly HydrationEntry[];
  /** Mounts the framework chart for one slot; returns what destroys it. */
  readonly mountChart: (element: HTMLElement, entry: HydrationEntry) => () => void;
}

function report(error: unknown): void {
  if (typeof reportError === 'function') reportError(error);
  else console.error(error);
}

export function attachDeck(root: HTMLElement, controller: DeckController, options: BindOptions, hydration?: DeckHydration): () => void {
  const undo: (() => void)[] = [];
  const viewport = root.querySelector<HTMLElement>('.sp-deck-viewport');
  if (viewport) undo.push(applyScaling(viewport));
  undo.push(bindDeck(root, controller, options));

  const fragments = () => applyFragments(root, controller.state.page, controller.state.step);
  fragments();
  undo.push(controller.on('state', fragments));

  for (const entry of hydration?.plan ?? []) {
    const element = root.querySelector<HTMLElement>(`[data-sp-slot="${entry.slotId}"]`);
    if (!element) continue;
    try {
      undo.push(hydration!.mountChart(element, entry));
    } catch (error) {
      // One chart that fails keeps its static SVG; the deck and the other charts go on.
      report(error);
    }
  }

  return () => {
    for (const fn of undo.splice(0).reverse()) {
      try {
        fn();
      } catch (error) {
        report(error);
      }
    }
  };
}
