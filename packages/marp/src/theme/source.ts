/**
 * The `silverpoint` Marpit theme. A minimal stub until T-262 writes the full theme from ground tokens
 * (DD-056). Marpit takes the slide size from the theme's `section` box (`size` is a Marp Core
 * directive, not a Marpit one), so the engine asks for the theme at the deck's size.
 */
export const THEME_NAME = 'silverpoint';

export function themeSource(size: { readonly width: number; readonly height: number }): string {
  return `/* @theme silverpoint */
section { width: ${size.width}px; height: ${size.height}px; box-sizing: border-box; }
`;
}
