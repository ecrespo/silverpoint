/**
 * The theme a deck engine adds to its Marpit instance: the rules at the deck's size and the
 * blocks of every registered ground (DD-056). Marpit takes the slide size from the theme's
 * `section` box (`size` is a Marp Core directive), so the engine asks for it at the deck's size.
 */
import { listGrounds } from '@silverpoint/grounds';
import { themeSource as source } from './silverpoint.css';

export { THEME_NAME } from './silverpoint.css';

export function themeSource(size: { readonly width: number; readonly height: number }): string {
  return source(size, listGrounds());
}
