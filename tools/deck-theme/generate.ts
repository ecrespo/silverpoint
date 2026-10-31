/**
 * Writes `packages/marp/theme.css` (T-264). Run after changing a ground or the theme's rules:
 *   pnpm --filter @silverpoint/deck-theme generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { GROUNDS_CSS_FILE, groundsCssSource } from './grounds-css';
import { THEME_FILE, themeCss } from './theme-file';

writeFileSync(THEME_FILE, themeCss());
console.log(`wrote packages/marp/theme.css (${themeCss().length} bytes)`);
mkdirSync(dirname(GROUNDS_CSS_FILE), { recursive: true });
writeFileSync(GROUNDS_CSS_FILE, groundsCssSource());
console.log('wrote packages/marp/src/cli/grounds-css.generated.ts');
