/**
 * `generate_code { deck }` (feature-006, API delta §11, REQ-621): an `SpDeck` in React, Vue or
 * Angular, and `sp_deck` in Reflex (reflex-silverpoint-react, #10), from the catalog's deck section
 * alone — its import, the four stylesheets of a deck page, the Markdown embedded verbatim, the page
 * held in the host's state, and `SpDeck`'s own props checked against the catalog.
 */
import type { Catalog } from '../catalog';
import { ToolError, unknownName } from '../errors';
import type { Framework } from '../types';
import { attribute, js, py } from './literals';

export interface DeckTarget {
  readonly markdown?: string;
}

export interface DeckCodeInput {
  readonly framework: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: string;
  readonly palette?: string;
}

/** Props the generated code writes itself: the Markdown, and the page it binds. */
const OWN = ['markdown', 'page', 'defaultPage'];
const APPEARANCE = ['ground', 'substrate', 'mode', 'palette'];

/** A template literal holding `source` verbatim, which cannot close a Vue SFC's `<script>` either. */
const templateLiteral = (source: string) =>
  `\`${source.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${').replace(/<\/script/gi, '<\\/script')}\``;

const kebab = (name: string) => name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** A starter deck: a title, the catalog's fence example, and a slide of fragments. */
function starter(catalog: Catalog): string {
  return ['# A deck in silverpoint', '', catalog.data.deck.fence.example, '', '---', '', '## What it shows', '', '* One point', '* Another point'].join('\n');
}

interface Attr {
  readonly name: string;
  readonly value: unknown;
}

function attrsOf(catalog: Catalog, input: DeckCodeInput): { attrs: Attr[]; notes: string[] } {
  const deck = catalog.data.deck;
  const attrs: Attr[] = [];
  const notes: string[] = [];
  if (input.ground !== undefined) attrs.push({ name: 'ground', value: catalog.ground(input.ground) });
  if (input.substrate !== undefined) attrs.push({ name: 'substrate', value: catalog.substrate(input.ground ?? 'silverpoint', input.substrate) });
  if (input.mode !== undefined) attrs.push({ name: 'mode', value: catalog.oneOf('mode', input.mode, ['ink', 'precision'] as const) });
  // A deck takes a preset's name (REQ-609): no import of the palette itself.
  if (input.palette !== undefined) attrs.push({ name: 'palette', value: catalog.palette(input.palette) });
  for (const [key, value] of Object.entries(input.props ?? {})) {
    if (OWN.includes(key)) throw new ToolError('invalid_input', `\`${key}\` is written by the generated code: give the Markdown as \`target.deck.markdown\`; the page is bound to state.`);
    if (APPEARANCE.includes(key)) throw new ToolError('invalid_input', `Give \`${key}\` as its own input, not in \`props\`.`);
    if (!deck.props.some((p) => p.name === key)) throw unknownName('prop of SpDeck', key, deck.props.map((p) => p.name).filter((n) => !OWN.includes(n)));
    attrs.push({ name: key, value });
  }
  return { attrs, notes };
}

function react(catalog: Catalog, markdown: string, attrs: readonly Attr[]): string {
  const deck = catalog.data.deck;
  const lines = [
    ...deck.stylesheets.map((s) => `import '${s}';`),
    `import { useState } from 'react';`,
    `import { ${deck.names.react} } from '${deck.imports.react}';`,
    '',
    `const MARKDOWN = ${templateLiteral(markdown)};`,
    '',
    'export function DeckView() {',
    '  const [page, setPage] = useState(1);',
    '  return (',
    `    <${deck.names.react}`,
    '      markdown={MARKDOWN}',
    '      page={page}',
    '      onPageChange={({ page }) => setPage(page)}',
    ...attrs.map((a) => `      ${typeof a.value === 'string' && !/["{}]/.test(a.value) ? `${a.name}="${a.value}"` : `${a.name}={${js(a.value)}}`}`),
    '    />',
    '  );',
    '}',
  ];
  return `${lines.join('\n')}\n`;
}

function vue(catalog: Catalog, markdown: string, attrs: readonly Attr[]): string {
  const deck = catalog.data.deck;
  const lines = [
    '<script setup lang="ts">',
    ...deck.stylesheets.map((s) => `import '${s}';`),
    `import { ref } from 'vue';`,
    `import { ${deck.names.vue} } from '${deck.imports.vue}';`,
    '',
    `const markdown = ${templateLiteral(markdown)};`,
    'const page = ref(1);',
    '</script>',
    '',
    '<template>',
    `  <${deck.names.vue}`,
    '    :markdown="markdown"',
    '    v-model:page="page"',
    ...attrs.map((a) => `    ${typeof a.value === 'string' ? `${kebab(a.name)}="${attribute(a.value)}"` : `:${kebab(a.name)}="${attribute(js(a.value))}"`}`),
    '  />',
    '</template>',
  ];
  return `${lines.join('\n')}\n`;
}

function angular(catalog: Catalog, markdown: string, attrs: readonly Attr[]): string {
  const deck = catalog.data.deck;
  const lines = [
    `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';`,
    `import { SpDeckComponent } from '${deck.imports.angular}';`,
    '',
    `const MARKDOWN = ${templateLiteral(markdown)};`,
    '',
    `/** Add ${deck.stylesheets.map((s) => `'${s}'`).join(', ')} to the \`styles\` of angular.json. */`,
    '@Component({',
    "  selector: 'app-deck-view',",
    '  imports: [SpDeckComponent],',
    '  changeDetection: ChangeDetectionStrategy.OnPush,',
    '  template: `',
    `    <${deck.names.angular}`,
    '      [markdown]="markdown"',
    '      [page]="page()"',
    '      (pageChange)="page.set($event.page)"',
    // Every input bound, strings too: `strictTemplates` checks a binding, never a static attribute.
    ...attrs.map((a) => `      [${a.name}]="${attribute(js(a.value))}"`),
    '    />',
    '  `,',
    '})',
    'export class DeckView {',
    '  protected readonly markdown = MARKDOWN;',
    '  protected readonly page = signal(1);',
    '}',
  ];
  return `${lines.join('\n')}\n`;
}

/**
 * A triple-quoted Python string holding `source` verbatim: every backslash escaped, and every double
 * quote that a quote or the end follows, so none can close the string early.
 */
const pythonString = (source: string) => `"""${source.replace(/\\/g, '\\\\').replace(/"(?="|$)/g, '\\"')}"""`;

function reflex(catalog: Catalog, markdown: string, attrs: readonly Attr[]): string {
  const deck = catalog.data.deck;
  const python = (name: string) => deck.props.find((p) => p.name === name)?.reflex ?? name;
  const lines = [
    'import reflex as rx',
    `from ${deck.imports.reflex} import ${deck.names.reflex}`,
    '',
    `MARKDOWN = ${pythonString(markdown)}`,
    '',
    '',
    'class State(rx.State):',
    '    page: int = 1',
    '',
    '    @rx.event',
    '    def set_page(self, page: int, total: int):',
    '        self.page = page',
    '',
    '',
    'def deck_view() -> rx.Component:',
    `    return ${deck.names.reflex}(`,
    '        MARKDOWN,',
    '        page=State.page,',
    '        on_page_change=State.set_page,',
    ...attrs.map((a) => `        ${python(a.name)}=${py(a.value)},`),
    '    )',
  ];
  return `${lines.join('\n')}\n`;
}

export function deckCode(catalog: Catalog, target: DeckTarget, input: DeckCodeInput): { imports: string[]; stylesheets: string[]; code: string; notes: string[] } {
  const framework: Framework = catalog.framework(input.framework);
  const deck = catalog.data.deck;
  if (framework === 'reflex' && deck.names.reflex === '') {
    throw new ToolError('unknown_name', 'The pinned Reflex catalog has no deck. Use react, vue or angular.', ['react', 'vue', 'angular']);
  }
  const markdown = target.markdown ?? starter(catalog);
  const { attrs, notes } = attrsOf(catalog, input);
  const code = { react, vue, angular, reflex }[framework](catalog, markdown, attrs);
  const framed = { react: ['react', deck.imports.react], vue: ['vue', deck.imports.vue], angular: ['@angular/core', deck.imports.angular], reflex: ['reflex', deck.imports.reflex] }[framework];
  return {
    imports: framed,
    stylesheets: [...deck.stylesheets],
    code,
    notes: [
      ...(framework === 'angular' ? ['Add the stylesheets to the `styles` array of angular.json.'] : []),
      ...(framework === 'react' ? ["`DeckView` holds the page in state: in the Next.js App Router, put `'use client'` at the top of its file."] : []),
      ...(framework === 'reflex'
        ? ['`State` is a placeholder name: merge its fields into your own state class.', '`sp_deck` imports the stylesheets and installs `@silverpoint/marp` itself.']
        : [`\`${deck.peer}\` is an optional peer of the adapter: install it beside it.`]),
      ...(target.markdown === undefined ? ['The Markdown is a starter deck: replace it with your own.'] : []),
      ...notes,
    ],
  };
}
