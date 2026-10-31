/** Fails when a file `tools/deck-theme` writes is not current (T-264, T-266, CI). */
import { existsSync, readFileSync } from 'node:fs';
import { GROUNDS_CSS_FILE, groundsCssSource } from './grounds-css';
import { THEME_FILE, themeCss } from './theme-file';

const stale = [
  [THEME_FILE, themeCss(), 'REQ-582 · packages/marp/theme.css'],
  [GROUNDS_CSS_FILE, groundsCssSource(), 'REQ-583 · packages/marp/src/cli/grounds-css.generated.ts'],
].filter(([file, content]) => !existsSync(file!) || readFileSync(file!, 'utf8') !== content);
for (const [, , name] of stale) console.error(`${name} is not current: run \`pnpm --filter @silverpoint/deck-theme generate\``);
if (stale.length > 0) process.exit(1);
console.log('packages/marp/theme.css and the CLI engine\'s grounds CSS are current');
