/** Where `@silverpoint/marp/theme.css` lives and what it must hold (DD-056, REQ-582). */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listGrounds } from '@silverpoint/grounds';
import { standaloneTheme } from '../../packages/marp/src/theme/standalone';

export const THEME_FILE = join(dirname(fileURLToPath(import.meta.url)), '../../packages/marp/theme.css');

/** The built-in grounds only: a host app's registered grounds never reach the published file. */
export const themeCss = (): string => standaloneTheme(listGrounds().filter((g) => g.name === 'silverpoint' || g.name === 'cyanotype'));
