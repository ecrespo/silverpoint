/** Limits of a spec (API delta §7, REQ-631, REQ-635). */

/** A spec's serialised size, in UTF-16 code units of its JSON (REQ-635). */
export const SPEC_BYTES = 2 * 1024 * 1024;
export const WIDTH = { min: 160, max: 1600 } as const;
export const HEIGHT = { min: 90, max: 1200 } as const;
/** The DOM-free render's width when the spec gives none. */
export const DEFAULT_WIDTH = 480;
