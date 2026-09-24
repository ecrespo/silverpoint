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

const kebab = (/** @type {string} */ name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * One of every chart, with its demo dataset and its fixture card, each under an id of its own:
 * the `?gallery` page every app shows, which axe-core audits (T-045).
 */
export const GALLERY = Object.freeze(
  FIXTURES.filter((fixture) => fixture.substrate === 'cream' && fixture.mode === 'ink').map((fixture) => ({
    chart: fixture.chart,
    props: { ...fixture.props, id: `sp-gallery-${kebab(fixture.chart)}`, width: 320 },
  })),
);

/** Whether the page asks for the gallery. */
export function wantsGallery(/** @type {string} */ search) {
  return new URLSearchParams(search).has('gallery');
}
