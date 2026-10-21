/**
 * The four spellings of one plan (REQ-541): React TSX, a Vue SFC, an Angular standalone component
 * and a Reflex page function. Each writes only the names, paths and props the plan holds.
 */
import { attribute, js, pascal, py, pyType, snake, text, tsType } from './literals';
import type { Bound, Plan } from './plan';

export interface Emitted {
  readonly imports: string[];
  readonly code: string;
}

const ROWS_TYPE = 'readonly Record<string, unknown>[]';
const PALETTES = '@silverpoint/core/palettes';

/** An element over several lines: one attribute per line, then its children. */
function element(tag: string, attrs: readonly string[], children: readonly string[], indent: string): string {
  const inner = `${indent}  `;
  const open = attrs.length === 0 ? `${indent}<${tag}` : `${indent}<${tag}\n${attrs.map((a) => `${inner}${a}`).join('\n')}\n${indent}`;
  if (children.length === 0) return `${open}${attrs.length === 0 ? ' ' : ''}/>`;
  return `${open}>\n${children.map((c) => `${inner}${c}`).join('\n')}\n${indent}</${tag}>`;
}

const capital = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
/** A bound state's type: its initial value's, and `null` when the component reports it. */
const stateType = (b: Bound) => `${tsType(b.initial)}${b.nullable ? ' | null' : ''}`;
const statePyType = (b: Bound) => `${pyType(b.initial)}${b.nullable ? ' | None' : ''}`;

function react(plan: Plan): Emitted {
  const name = plan.names.react;
  const view = `${pascal(plan.slug)}View`;
  const attrs: string[] = [];
  if (plan.kind === 'chart') attrs.push('data={rows}');
  for (const a of plan.attrs) attrs.push(typeof a.value === 'string' && !/["{}]/.test(a.value) ? `${a.name}="${a.value}"` : `${a.name}={${js(a.value)}}`);
  for (const s of plan.slots) attrs.push(`${s.name}=${js(s.text) === `'${s.text}'` && !/["{}]/.test(s.text) ? `"${s.text}"` : `{${js(s.text)}}`}`);
  if (plan.trigger !== undefined) attrs.push(`trigger={<button type="button">${text(plan.trigger)}</button>}`);
  for (const b of plan.bound) attrs.push(`${b.prop}={${b.state}}`, `${b.handler}={set${capital(b.state)}}`);
  if (plan.palette) attrs.push(`palette={${plan.palette}}`);
  const children = plan.content === undefined ? [] : [text(plan.content)];

  const lines = plan.stylesheets.map((s) => `import '${s}';`);
  const imports: string[] = [];
  if (plan.bound.length > 0) {
    lines.push(`import { useState } from 'react';`);
    imports.push('react');
  }
  if (plan.palette) {
    lines.push(`import { ${plan.palette} } from '${PALETTES}';`);
    imports.push(PALETTES);
  }
  lines.push(`import { ${name} } from '${plan.import}';`);
  imports.push(plan.import);
  const signature = plan.kind === 'chart' ? `{ rows }: { rows: ${ROWS_TYPE} }` : '';
  const state = plan.bound.map((b) => `  const [${b.state}, set${capital(b.state)}] = useState<${stateType(b)}>(${js(b.initial)});`);
  const body = [`export function ${view}(${signature}) {`, ...state, '  return (', element(name, attrs, children, '    '), '  );', '}'];
  return { imports, code: `${lines.join('\n')}\n\n${body.join('\n')}\n` };
}

function vue(plan: Plan): Emitted {
  const name = plan.names.vue;
  const attrs: string[] = [];
  if (plan.kind === 'chart') attrs.push(':data="rows"');
  for (const a of plan.attrs) attrs.push(typeof a.value === 'string' ? `${a.name}="${attribute(a.value)}"` : `:${a.name}="${attribute(js(a.value))}"`);
  for (const b of plan.bound) attrs.push(`${b.vue}="${b.state}"`);
  if (plan.palette) attrs.push(`:palette="${plan.palette}"`);
  const children: string[] = [];
  if (plan.trigger !== undefined) children.push(`<template #trigger><button type="button">${text(plan.trigger)}</button></template>`);
  for (const s of plan.slots) children.push(`<template #${s.name}>${text(s.text)}</template>`);
  if (plan.content !== undefined) children.push(text(plan.content));

  const lines = plan.stylesheets.map((s) => `import '${s}';`);
  const imports: string[] = [];
  if (plan.bound.length > 0) {
    lines.push(`import { ref } from 'vue';`);
    imports.push('vue');
  }
  if (plan.palette) {
    lines.push(`import { ${plan.palette} } from '${PALETTES}';`);
    imports.push(PALETTES);
  }
  lines.push(`import { ${name} } from '${plan.import}';`);
  imports.push(plan.import);
  const setup = [
    ...(plan.kind === 'chart' ? [`defineProps<{ rows: ${ROWS_TYPE} }>();`] : []),
    ...plan.bound.map((b) => (b.initial === null || b.initial === undefined ? `const ${b.state} = ref<string>();` : `const ${b.state} = ref<${stateType(b)}>(${js(b.initial)});`)),
  ];
  const script = ['<script setup lang="ts">', ...lines, ...(setup.length > 0 ? ['', ...setup] : []), '</script>'];
  const template = ['<template>', element(name, attrs, children, '  '), '</template>'];
  return { imports, code: `${script.join('\n')}\n\n${template.join('\n')}\n` };
}

/** A TypeScript template literal's body. */
const backticked = (source: string) => source.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

function angular(plan: Plan): Emitted {
  const cls = plan.names.vue;
  const view = `${pascal(plan.slug)}View`;
  const attrs: string[] = [];
  if (plan.kind === 'chart') attrs.push('[data]="rows()"');
  // Every input bound, strings too: `strictTemplates` checks a binding, never a static attribute.
  for (const a of plan.attrs) attrs.push(`[${a.name}]="${attribute(js(a.value))}"`);
  for (const b of plan.bound) attrs.push(`${b.angular}="${b.state}"`);
  if (plan.palette) attrs.push(`[palette]="${plan.palette}"`);
  const children: string[] = [];
  if (plan.trigger !== undefined) children.push(`<button type="button" spTrigger>${text(plan.trigger)}</button>`);
  if (plan.content !== undefined) children.push(text(plan.content));
  const tag = plan.names.angular;
  const markup = tag.includes('[')
    ? // `[spSurface]` names no element: it sits on a div, the consumer's own element in practice.
      element(tag.replace(/\[(\w+)\]$/, '') || 'div', [tag.match(/\[(\w+)\]$/)![1]!, ...attrs], children, '    ')
    : element(tag, attrs, children, '    ');

  const symbols = ['ChangeDetectionStrategy', 'Component', ...(plan.kind === 'chart' ? ['input'] : []), ...(plan.bound.length > 0 ? ['signal'] : [])];
  const own = plan.trigger !== undefined ? [cls, 'SpTrigger'] : [cls];
  const lines = [`import { ${symbols.join(', ')} } from '@angular/core';`];
  const imports = ['@angular/core'];
  if (plan.palette) {
    lines.push(`import { ${plan.palette} } from '${PALETTES}';`);
    imports.push(PALETTES);
  }
  lines.push(`import { ${own.join(', ')} } from '${plan.import}';`);
  imports.push(plan.import);
  const members = [
    ...(plan.kind === 'chart' ? [`  readonly rows = input.required<${ROWS_TYPE}>();`] : []),
    ...plan.bound.map((b) => `  protected readonly ${b.state} = signal<${stateType(b)}>(${js(b.initial)});`),
    ...(plan.palette ? [`  protected readonly ${plan.palette} = ${plan.palette};`] : []),
  ];
  const body = [
    `/** Add ${plan.stylesheets.map((s) => `'${s}'`).join(', ')} to the \`styles\` of angular.json. */`,
    '@Component({',
    `  selector: 'app-${plan.slug}-view',`,
    `  imports: [${own.join(', ')}],`,
    '  changeDetection: ChangeDetectionStrategy.OnPush,',
    `  template: \`\n${backticked(markup)}\n  \`,`,
    '})',
    `export class ${view} {`,
    ...members,
    '}',
  ];
  if (members.length === 0) body.splice(body.length - 2, 2, `export class ${view} {}`);
  return { imports, code: `${lines.join('\n')}\n\n${body.join('\n')}\n` };
}

function reflex(plan: Plan): Emitted {
  const builder = plan.names.reflex;
  const args: string[] = [];
  if (plan.content !== undefined && !plan.attrs.some((a) => a.reflex === 'content')) args.push(py(plan.content));
  if (plan.kind === 'chart') args.push('data=State.rows');
  for (const a of plan.attrs) args.push(`${a.reflex}=${py(a.value)}`);
  for (const s of plan.slots) args.push(`${snake(s.name)}=${py(s.text)}`);
  if (plan.trigger !== undefined) args.push(`trigger=${py(plan.trigger)}`);
  for (const b of plan.bound) args.push(`${snake(b.prop)}=State.${b.state}`, `${snake(b.handler)}=State.set_${b.state}`);
  if (plan.palette) args.push(`palette=${py(snake(plan.palette))}`);

  const fields =
    plan.kind === 'chart'
      ? ['    rows: list[dict] = []']
      : plan.bound.flatMap((b) => {
          const type = statePyType(b);
          const initial = b.initial === null || b.initial === undefined ? '""' : py(b.initial);
          return [`    ${b.state}: ${type} = ${initial}`];
        });
  const handlers = plan.bound.flatMap((b) => ['', '    @rx.event', `    def set_${b.state}(self, ${b.state}: ${statePyType(b)}):`, `        self.${b.state} = ${b.state}`]);
  const state = fields.length > 0 ? ['class State(rx.State):', ...fields, ...handlers, '', ''] : [];
  const call = args.length === 0 ? `${builder}()` : `${builder}(\n${args.map((a) => `        ${a},`).join('\n')}\n    )`;
  const code = ['import reflex as rx', `from reflex_silverpoint_react import ${builder}`, '', '', ...state, `def ${snake(plan.slug.replace(/-/g, '_'))}_view() -> rx.Component:`, `    return ${call}`];
  return { imports: ['reflex', 'reflex_silverpoint_react'], code: `${code.join('\n')}\n` };
}

export function emit(plan: Plan): Emitted {
  switch (plan.framework) {
    case 'react':
      return react(plan);
    case 'vue':
      return vue(plan);
    case 'angular':
      return angular(plan);
    case 'reflex':
      return reflex(plan);
  }
}
