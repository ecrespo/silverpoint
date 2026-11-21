/** `silverpoint-embed.full.js`: the script with EB Garamond inlined; the element defined on load. */
import { boot } from './boot';
import { installFullFonts } from './full-fonts';

installFullFonts();
export * from './api';
boot();
