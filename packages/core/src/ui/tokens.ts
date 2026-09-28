import type { Ground, UiTokens } from '../types';

/** The `ui` tokens of a ground that declares none (Data Model §3.8). */
export const UI_TOKEN_DEFAULTS: UiTokens = /* @__PURE__ */ Object.freeze({
  frame: 'css',
  frameVariants: 1,
  controlHeight: Object.freeze({ sm: 24, md: 32, lg: 40 }),
  radius: 2,
  focusWidth: 2,
  tone: Object.freeze({ selected: 3, primary: 2, danger: 4, disabled: 1, alertError: 1 }),
});

/** The smallest target WCAG 2.5.8 allows, and the thinnest focus REQ-316 allows. */
const MIN_HEIGHT = 24;
const MIN_FOCUS = 2;

const within = (value: number, lo: number, hi: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(Math.max(value, lo), hi) : fallback;

/**
 * A ground's `ui` tokens, or the defaults, held to their domain: heights ≥ 24 px, focus ≥ 2 px,
 * 1..6 variants. A `weight` ground has no inker that draws by hand, so its frame is always the
 * exact `css` one with a single variant (DD-022). Pure.
 */
export function resolveUiTokens(ground: Ground): UiTokens {
  const ui = ground.ui ?? UI_TOKEN_DEFAULTS;
  const inked = ui.frame === 'inked' && ground.tonalMechanism === 'hatch';
  const { sm, md, lg } = ui.controlHeight;
  return {
    frame: inked ? 'inked' : 'css',
    frameVariants: inked ? Math.round(within(ui.frameVariants, 1, 6, 1)) : 1,
    controlHeight: {
      sm: within(sm, MIN_HEIGHT, Infinity, 24),
      md: within(md, MIN_HEIGHT, Infinity, 32),
      lg: within(lg, MIN_HEIGHT, Infinity, 40),
    },
    radius: within(ui.radius, 0, Infinity, 2),
    focusWidth: within(ui.focusWidth, MIN_FOCUS, Infinity, 2),
    tone: ui.tone,
  };
}
