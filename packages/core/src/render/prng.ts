/**
 * A seeded 32-bit PRNG (mulberry32), for generated demo data (Data Model §4). Owned here rather
 * than imported, so its sequence is frozen by SemVer like the seed derivation (DD-006): changing
 * it changes demo output, which is never a patch.
 */
export function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
