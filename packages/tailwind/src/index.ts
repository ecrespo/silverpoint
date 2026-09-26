import { COLORS, FONT_DISPLAY, RADIUS } from './tokens';

/**
 * The Tailwind 3.4 preset (REQ-047, API Spec §10.4): `presets: [require('@silverpoint/tailwind')]`.
 * It gives `bg-sp-substrate`, `text-sp-ink`, `border-sp-rule` and the other colours,
 * `font-sp-display` and `rounded-sp`, each reading its `--sp-` variable. For Tailwind 4, import
 * `@silverpoint/tailwind/theme.css` instead. It imports nothing from Tailwind (Art. 8).
 */
const preset = {
  theme: {
    extend: {
      colors: { sp: COLORS },
      fontFamily: { 'sp-display': FONT_DISPLAY },
      borderRadius: { sp: RADIUS },
    },
  },
} as const;

export default preset;
