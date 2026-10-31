/** Fails when `packages/marp/theme.css` is not what the grounds and the rules give (T-264, CI). */
import { existsSync, readFileSync } from 'node:fs';
import { THEME_FILE, themeCss } from './theme-file';

if (!existsSync(THEME_FILE) || readFileSync(THEME_FILE, 'utf8') !== themeCss()) {
  console.error('REQ-582 · packages/marp/theme.css is not current: run `pnpm --filter @silverpoint/deck-theme generate`');
  process.exit(1);
}
console.log('packages/marp/theme.css is current');
