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
    // TD §6: user text enters as a text node, never as markup — in the packages and the apps alike.
    files: [
      'packages/*/src/**/*.{ts,tsx,vue}',
      'packages/angular/!(test|dist|node_modules)/**/*.ts',
      'examples/*/src/**/*.{ts,tsx,vue}',
      'examples/nextjs/app/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "AssignmentExpression > MemberExpression.left[property.name=/^(inner|outer)HTML$/]", message: 'TD §6: no markup injection; build nodes instead.' },
        { selector: "CallExpression[callee.property.name='insertAdjacentHTML']", message: 'TD §6: no markup injection; build nodes instead.' },
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: 'TD §6: no markup injection; render elements instead.' },
      ],
    },
  },
  {
    // REQ-162: the core's runtime allowlist.
    files: ['packages/core/src/**/*.ts'],
    plugins: { silverpoint },
    rules: { 'silverpoint/core-allowlist': 'error' },
  },
];
