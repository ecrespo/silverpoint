/**
 * The fixture matrix as every example app sees it, plus the props builder the string gate uses.
 * Kept in plain JavaScript so Vite, Next.js and the Angular CLI consume it without a transform.
 */
import { FIXTURES } from './fixtures.generated.js';

export { FIXTURES };

/** @param {string | null | undefined} id */
export function fixtureById(id) {
  return FIXTURES.find((fixture) => fixture.id === id);
}

/**
 * The same props `tools/visual-gate/fixtures.ts#fixtureProps` builds — a test holds them equal.
 * @param {(typeof FIXTURES)[number]} fixture
 */
export function fixtureProps(fixture) {
  return {
    ...fixture.props,
    ...(fixture.rows === null ? {} : { data: fixture.rows }),
    id: fixture.id,
    ground: fixture.ground,
    substrate: fixture.substrate,
    mode: fixture.mode,
    hatchFill: fixture.hatchFill,
    seed: fixture.seed,
    width: fixture.size.width,
    height: fixture.size.height,
  };
}

/** The chart the home page of every example app shows. */
export const DEMO_PROPS = Object.freeze({
  id: 'sp-demo',
  width: 320,
  title: 'Throughput per hour',
  badge: 'Live',
  value: 88,
  unit: 'requests',
  footerLeft: '00–22 h',
  footerRight: 'silverpoint',
});
