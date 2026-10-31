/**
 * Author CSS and directive values are untrusted (REQ-575). Marpit accepts author CSS —`<style>`,
 * `<style scoped>`, the `style` directive— and the adapters inject the deck's CSS into a `<style>`
 * element, so two things are neutralised here rather than forbidding author CSS (Marp decks use it):
 *
 *  - every `<` becomes the CSS escape `\3c `, so no `</style` can end the element in the HTML parser
 *    (inside a CSS string the escape still means `<`; nowhere else in valid CSS does `<` appear);
 *  - every `@import` statement outside strings and comments is removed: a deck may not pull a
 *    stylesheet from elsewhere, whose rules Marpit could not scope to the deck.
 */
export function sanitiseDeckCss(css: string): string {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const c = css[i]!;
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      out += css.slice(i, stop);
      i = stop;
    } else if (c === '"' || c === "'") {
      const stop = endOfString(css, i);
      out += css.slice(i, stop);
      i = stop;
    } else if (c === '@' && /^@import\b/i.test(css.slice(i, i + 8))) {
      i = endOfStatement(css, i);
    } else {
      out += c;
      i += 1;
    }
  }
  return out.replace(/</g, '\\3c ');
}

/** Index just past the string opening at `start` (CSS strings end at their quote or a newline). */
function endOfString(css: string, start: number): number {
  const quote = css[start];
  let i = start + 1;
  while (i < css.length) {
    const c = css[i]!;
    if (c === '\\') i += 2;
    else if (c === quote || c === '\n') return i + 1;
    else i += 1;
  }
  return css.length;
}

/** Index just past the `;` that ends the at-rule statement at `start`, strings skipped. */
function endOfStatement(css: string, start: number): number {
  let i = start;
  while (i < css.length) {
    const c = css[i]!;
    if (c === '"' || c === "'") i = endOfString(css, i);
    else if (c === ';') return i + 1;
    else if (c === '{' || c === '}') return i;     // malformed: stop before the block, drop the prelude
    else i += 1;
  }
  return css.length;
}

const SAFE_DATA = /^data:image\/(?:png|jpeg|gif|webp);/i;
const URL_IN_VALUE = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

/**
 * Whether a `backgroundImage` directive value may reach a `style` attribute: every `url()` in it
 * must be http(s), relative, or a raster `data:` image, as markdown-it's own link check allows.
 */
export function isSafeBackgroundImage(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  for (const [, , url] of value.matchAll(URL_IN_VALUE)) {
    const scheme = /^\s*([a-z][a-z0-9+.-]*):/i.exec(url ?? '')?.[1]?.toLowerCase();
    if (scheme === undefined || scheme === 'http' || scheme === 'https') continue;
    if (scheme === 'data' && SAFE_DATA.test(url!.trim())) continue;
    return false;
  }
  return true;
}
