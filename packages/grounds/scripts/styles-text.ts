/**
 * `@silverpoint/grounds/styles-text` (#19): the stylesheet of `styles.css` as an ES module whose
 * default export is the text, so a bundler imports it with no loader attribute, no `?raw` and no
 * prebundle setting. Its one use is `standaloneSVG`.
 */
export function stylesTextModule(css: string): { readonly js: string; readonly dts: string } {
  return {
    js: `export default ${JSON.stringify(css)};\n`,
    dts: '/** The text of `@silverpoint/grounds/styles.css`, for `standaloneSVG`. */\ndeclare const styles: string;\nexport default styles;\n',
  };
}
