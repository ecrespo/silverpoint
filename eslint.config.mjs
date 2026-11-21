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
      'docs/site/src/**/*.{ts,tsx}',
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
    // REQ-201, Art. 2: a dashboard adapter writes the numbers of the core's model, and computes none.
    files: [
      'packages/react/src/**/dashboard*.tsx',
      'packages/vue/src/**/{SpDashboard,SpDashboardCell,dashboard,dashboard-context}.ts',
      'packages/angular/dashboard/**/*.ts',
      'packages/angular/env/dashboard-cell.ts',
    ],
    plugins: { silverpoint },
    rules: { 'silverpoint/dashboard-no-layout-maths': 'error' },
  },
  {
    // REQ-435, DD-028: the derived-geometry modules of the second catalog use only correctly
    // rounded arithmetic, so Node and every browser produce the same coordinates.
    files: ['packages/core/src/charts/shared/{stats,density,distribution,beeswarm,hierarchy,field,delaunay,network,contracts}.ts'],
    plugins: { silverpoint },
    rules: { 'silverpoint/no-transcendental': 'error' },
  },
  {
    // feature-007, DD-061: the embed's DOM-free entries (main, hosts, conformance) read no DOM global,
    // so Node, workers and the module build can import them.
    files: ['packages/embed/src/{index,api,registry,recipes.generated}.ts', 'packages/embed/src/{spec,render,hosts,conformance,util}/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', ...['document', 'window', 'HTMLElement', 'customElements', 'navigator', 'matchMedia', 'ResizeObserver', 'MutationObserver', 'localStorage', 'sessionStorage'].map((name) => ({ name, message: 'DD-061: a DOM-free entry of @silverpoint/embed reads no DOM global; the DOM belongs in client/.' }))],
    },
  },
  {
    // REQ-652: no package but the MCP server imports the embed; the core, the grounds and the adapters never.
    files: ['packages/{core,grounds,react,vue,marp,fonts,tailwind}/src/**/*.{ts,tsx,vue}', 'packages/angular/!(test|dist|node_modules)/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@silverpoint/embed', '@silverpoint/embed/*'], message: 'REQ-652: only @silverpoint/mcp may import @silverpoint/embed.' }] }],
    },
  },
  {
    // REQ-162: the core's runtime allowlist.
    files: ['packages/core/src/**/*.ts'],
    plugins: { silverpoint },
    rules: { 'silverpoint/core-allowlist': 'error' },
  },
];
