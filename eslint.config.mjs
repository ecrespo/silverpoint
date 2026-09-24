import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import silverpoint from './tools/lint-rules/plugin.mjs';

// Angular's secondary entry points (line-chart/, …) live beside src/ and are adapter code too.
const ADAPTERS = ['packages/react/src', 'packages/vue/src', 'packages/angular/src', 'packages/angular/!(src|test|dist|node_modules)'];

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**', '**/.angular/**', 'tools/lint-rules/fixtures/**'],
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: { parser: tseslint.parser, sourceType: 'module' },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, sourceType: 'module' },
    },
  },
  {
    // REQ-004: the render path is every package's source.
    files: ['packages/*/src/**/*.{ts,tsx,vue,mjs,js}', 'packages/angular/!(test|dist|node_modules)/**/*.ts'],
    plugins: { silverpoint },
    rules: { 'silverpoint/no-nondeterminism': 'error' },
  },
  {
    // REQ-027, REQ-102, REQ-106: adapters translate and compute nothing.
    files: ADAPTERS.map((dir) => `${dir}/**/*.{ts,tsx,vue}`),
    plugins: { silverpoint },
    rules: { 'silverpoint/adapter-boundary': 'error' },
  },
  {
    // REQ-162: the core's runtime allowlist.
    files: ['packages/core/src/**/*.ts'],
    plugins: { silverpoint },
    rules: { 'silverpoint/core-allowlist': 'error' },
  },
];
