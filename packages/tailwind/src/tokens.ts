/**
 * The one mapping (DD-020): each Tailwind token and the public silverpoint variable it names
 * (API Spec §10.2). Names only: the values stay in `@silverpoint/grounds`, so a utility follows the
 * chart's ground, substrate and any override (REQ-042, Art. 7). `theme.css` is held equal to it.
 */
export const COLORS = {
  substrate: 'var(--sp-substrate)',
  ink: 'var(--sp-ink)',
  'ink-secondary': 'var(--sp-ink-secondary)',
  heighten: 'var(--sp-heighten)',
  rule: 'var(--sp-rule)',
  grid: 'var(--sp-grid)',
  text: 'var(--sp-text)',
  'text-muted': 'var(--sp-text-muted)',
} as const;

export const FONT_DISPLAY = 'var(--sp-font-display)';
export const RADIUS = 'var(--sp-radius)';
