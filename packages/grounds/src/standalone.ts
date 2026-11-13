/** The root `<svg …>` tag, to its closing `>`; a `>` inside a quoted attribute does not end it. */
const ROOT = /^<svg(?:[^>"']|"[^"]*"|'[^']*')*>/;

/**
 * A chart's SVG as a file that paints itself (#14). `toSVGString()` returns the canonical markup,
 * whose strokes and fills are painted by the page's stylesheet through `--sp-*` properties: opened
 * on its own it has no colours. This puts a stylesheet —the text of `@silverpoint/grounds/styles.css`,
 * importable as `@silverpoint/grounds/styles-text`— inside the root as its first child. The
 * stylesheet goes in CDATA, since it names `<svg>` in a comment and the file must stay XML.
 * Markup that is not an `<svg>` root is returned unchanged.
 */
export function standaloneSVG(svg: string, css: string): string {
  const open = ROOT.exec(svg)?.[0];
  if (open === undefined) return svg;
  return `${open}<style><![CDATA[${css.replaceAll(']]>', ']]]]><![CDATA[>')}]]></style>${svg.slice(open.length)}`;
}
