import type { Datum } from '../../types';

/** Demo dataset of `ChordRing` (REQ-093): visitors moving between five sections of a site. Frozen (Data Model §4). */
export const CHORD_RING_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  [
    { source: 'Home', target: 'Shop', value: 42 },
    { source: 'Home', target: 'Blog', value: 28 },
    { source: 'Blog', target: 'Shop', value: 16 },
    { source: 'Shop', target: 'Cart', value: 35 },
    { source: 'Cart', target: 'Shop', value: 12 },
    { source: 'Blog', target: 'Home', value: 9 },
    { source: 'Help', target: 'Cart', value: 7 },
    { source: 'Shop', target: 'Help', value: 11 },
  ].map((row) => Object.freeze(row)),
);
