/**
 * Writes `packages/marp/theme.css` (T-264). Run after changing a ground or the theme's rules:
 *   pnpm --filter @silverpoint/deck-theme generate
 */
import { writeFileSync } from 'node:fs';
import { THEME_FILE, themeCss } from './theme-file';

writeFileSync(THEME_FILE, themeCss());
console.log(`wrote packages/marp/theme.css (${themeCss().length} bytes)`);
