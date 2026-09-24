import { createPrng } from '../../render/prng';
import type { Datum } from '../../types';
import { isoDate, parseIsoDate, weekday } from '../shared/dates';

/** The demo's pinned end date: never `today`, so server and client agree (Data Model §4). */
export const ACTIVITY_GRID_DEMO_END = '2026-06-30';
/** The demo's fixed seed, which pins the counts. */
export const ACTIVITY_GRID_DEMO_SEED = 1592;
const DAYS = 26 * 7;

/**
 * Demo dataset of `ActivityGrid` (REQ-093), the only generated one: 26 weeks ending on
 * {@link ACTIVITY_GRID_DEMO_END}, counts drawn from {@link ACTIVITY_GRID_DEMO_SEED}. It is
 * generated once, at module load, and frozen; the level is quantised here, as a consumer would,
 * because the library never derives it from the count (Data Model §2.8).
 */
export const ACTIVITY_GRID_DEMO: readonly Datum[] = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ (() => {
    const next = createPrng(ACTIVITY_GRID_DEMO_SEED);
    const first = parseIsoDate(ACTIVITY_GRID_DEMO_END) - (DAYS - 1);
    return Array.from({ length: DAYS }, (_, i) => {
      const day = first + i;
      const weekend = weekday(day) === 0 || weekday(day) === 6;
      const r = next();
      const count = Math.floor(r * r * (weekend ? 5 : 14));
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4;
      return Object.freeze({ date: isoDate(day), count, level });
    });
  })(),
);
