/**
 * T-290 build and measurement (DD-062 protocol): the four standalone files plus the fallback
 * variant, minified, target es2020; raw, gzip (level 9) and brotli (quality 11) bytes; a size
 * breakdown by package from esbuild's metafile. Writes dist/ and results/sizes.json.
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const require = createRequire(join(repo, 'node_modules', '.pnpm', 'esbuild@0.28.2', 'node_modules', 'esbuild', 'package.json'));
const esbuild = require('esbuild');
const version = JSON.parse(readFileSync(join(repo, 'packages/core/package.json'), 'utf8')).version;

const pkg = (p) => join(repo, 'packages', p);
const alias = {
  '@silverpoint/core/catalog': pkg('core/dist/catalog.js'),
  '@silverpoint/core/palettes': pkg('core/dist/palettes.js'),
  '@silverpoint/core': pkg('core/dist/index.js'),
  '@silverpoint/grounds/styles-text': pkg('grounds/dist/styles-text.js'),
  '@silverpoint/grounds': pkg('grounds/dist/index.js'),
};
const font = (file) => readFileSync(pkg(`fonts/files/${file}`)).toString('base64');
const fontCss = () =>
  [['normal', 400, 'eb-garamond-latin-400-normal.woff2'], ['normal', 500, 'eb-garamond-latin-500-normal.woff2'], ['italic', 400, 'eb-garamond-latin-400-italic.woff2']]
    .map(([style, weight, file]) => `@font-face{font-family:'EB Garamond';font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${font(file)}) format('woff2')}`)
    .join('');

const fontsPlugin = (full) => ({
  name: 'embed-poc-fonts',
  setup(build) {
    build.onResolve({ filter: /^embed-poc:fonts$/ }, () => ({ path: 'fonts', namespace: 'embed-poc' }));
    build.onLoad({ filter: /.*/, namespace: 'embed-poc' }, () => ({ contents: `export const FONT_CSS = ${JSON.stringify(full ? fontCss() : '')};`, loader: 'js' }));
  },
});
/** The fallback of DD-062: the first catalog only (33 charts), `@silverpoint/core/catalog` stubbed out. */
const firstCatalogPlugin = {
  name: 'first-catalog',
  setup(build) {
    build.onLoad({ filter: /registry\.generated\.ts$/ }, (args) => {
      const source = readFileSync(args.path, 'utf8').split('\n');
      const second = source.find((l) => l.includes("'@silverpoint/core/catalog'"));
      const names = second.slice(second.indexOf('{') + 1, second.indexOf('}')).split(',').map((n) => n.trim());
      return { contents: source.filter((l) => l !== second && !names.some((n) => l.includes(`, ${n}]`))).join('\n'), loader: 'ts' };
    });
  },
};

const variants = [
  { file: 'silverpoint-embed.js', entry: 'src/standalone.ts', format: 'iife', full: false },
  { file: 'silverpoint-embed.mjs', entry: 'src/embed.ts', format: 'esm', full: false },
  { file: 'silverpoint-embed.full.js', entry: 'src/standalone.ts', format: 'iife', full: true },
  { file: 'silverpoint-embed.full.mjs', entry: 'src/embed.ts', format: 'esm', full: true },
  { file: 'silverpoint-embed.core.js', entry: 'src/standalone.ts', format: 'iife', full: false, first: true },
];

mkdirSync(join(here, 'dist'), { recursive: true });
mkdirSync(join(here, 'results'), { recursive: true });
const results = { version, built: 'esbuild 0.28.2, minify, target es2020, no source map', files: {} };
for (const v of variants) {
  const out = await esbuild.build({
    entryPoints: [join(here, v.entry)],
    bundle: true,
    minify: true,
    format: v.format,
    globalName: v.format === 'iife' ? 'Silverpoint' : undefined,
    target: 'es2020',
    platform: 'browser',
    alias,
    define: { __VERSION__: JSON.stringify(version) },
    banner: { js: `/*! @silverpoint/embed ${version} (PoC, T-290) | MIT */` },
    plugins: [fontsPlugin(v.full), ...(v.first ? [firstCatalogPlugin] : [])],
    write: false,
    metafile: true,
    legalComments: 'none',
    logLevel: 'error',
  });
  const code = out.outputFiles[0].contents;
  writeFileSync(join(here, 'dist', v.file), code);
  const byPackage = {};
  for (const [input, meta] of Object.entries(out.metafile.outputs[Object.keys(out.metafile.outputs)[0]].inputs)) {
    const key = input.startsWith('embed-poc:') ? 'fonts (inlined)' : input.includes('roughjs') ? 'roughjs' : /\/(d3-[a-z]+|internmap)@/.test(input) ? 'd3' : input.match(/packages\/(\w+)\//)?.[1] ?? relative(here, input);
    byPackage[key] = (byPackage[key] ?? 0) + meta.bytesInOutput;
  }
  results.files[v.file] = {
    raw: code.length,
    gzip: gzipSync(code, { level: 9 }).length,
    brotli: brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    byPackage,
  };
}
writeFileSync(join(here, 'results', 'sizes.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
