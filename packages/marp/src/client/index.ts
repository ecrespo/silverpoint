/** `@silverpoint/marp/client` — the browser half: the controller, bindings, scaling, slots (DD-052). */
export { createDeckController } from '../controller';
export type { DeckController, DeckControllerOptions, DeckAction, DeckEvents, DeckState } from '../controller';
export { bindDeck, fullscreenAvailable, SWIPE_DISTANCE, SWIPE_RATIO } from './bind';
export type { BindOptions } from './bind';
export { applyFragments, applyScaling, findChartSlots } from './dom';
export type { FoundSlot } from './dom';
export { attachDeck } from './attach';
export type { DeckHydration } from './attach';
