/**
 * What each adapter adds to a UI component beyond the core's props (REQ-532): its Angular name,
 * how its value and open state bind, its events and its named content. Read from the adapters'
 * sources with the TypeScript compiler, so the catalog states what the adapters do, not what a
 * table says they do.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { AdapterFramework, Binding } from '../../packages/mcp/src/types';

const PACKAGES = fileURLToPath(new URL('../../packages/', import.meta.url));

export interface ComponentSurface {
  /** The Angular selector (its first, when the component lists several). */
  readonly selector: string;
  readonly binding?: Binding;
  readonly events: Readonly<Record<AdapterFramework, readonly string[]>>;
  readonly slots: Readonly<Record<AdapterFramework, readonly string[]>>;
}

const parse = (file: string) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const sorted = (names: Iterable<string>) => [...new Set(names)].sort();

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

/* ---------------------------------------------------------------- React */

interface Member {
  readonly name: string;
  readonly type: string;
}

/** Members of the adapter's own interfaces, `CoreProps` and `UiCellProps` left out. */
function reactMembers(slug: string, component: string): Member[] {
  const dir = join(PACKAGES, 'react/src/ui');
  const local = new Map<string, ts.InterfaceDeclaration>();
  for (const name of ['overlay.ts', 'base.ts', `${slug}.tsx`]) {
    parse(join(dir, name)).forEachChild((node) => {
      if (ts.isInterfaceDeclaration(node)) local.set(node.name.text, node);
    });
  }
  const members = (name: string): Member[] => {
    const node = local.get(name);
    if (!node || name === 'UiCellProps') return [];
    const inherited = (node.heritageClauses ?? []).flatMap((c) => c.types.map((t) => t.expression.getText())).flatMap(members);
    const own = node.members.filter(ts.isPropertySignature).map((m) => ({ name: m.name.getText(), type: m.type?.getText() ?? '' }));
    return [...inherited, ...own];
  };
  const found = members(`${component}Props`);
  if (found.length === 0 && !local.has(`${component}Props`)) throw new Error(`packages/react/src/ui/${slug}.tsx has no ${component}Props`);
  return found;
}

function reactSurface(slug: string, component: string) {
  const members = reactMembers(slug, component);
  const names = new Set(members.map((m) => m.name));
  const controlled = members.find((m) => names.has(`default${m.name[0]!.toUpperCase()}${m.name.slice(1)}`) && m.name !== 'open');
  return {
    value: controlled && names.has('onChange') ? `${controlled.name} + onChange` : undefined,
    open: names.has('open') && names.has('onOpenChange') ? 'open + onOpenChange' : undefined,
    events: sorted(members.filter((m) => /^on[A-Z]/.test(m.name)).map((m) => m.name)),
    slots: sorted(members.filter((m) => /React(Node|Element)/.test(m.type)).map((m) => m.name)),
  };
}

/* ---------------------------------------------------------------- Vue */

/** Object literals exported by the Vue UI modules, by name: `OPEN_EMITS` and its kind. */
function vueConstants(): Map<string, ts.Expression> {
  const constants = new Map<string, ts.Expression>();
  for (const name of readdirSync(join(PACKAGES, 'vue/src/ui'))) {
    parse(join(PACKAGES, 'vue/src/ui', name)).forEachChild((node) => {
      if (!ts.isVariableStatement(node)) return;
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) constants.set(decl.name.text, ts.isAsExpression(decl.initializer) ? decl.initializer.expression : decl.initializer);
      }
    });
  }
  return constants;
}

function emitNames(node: ts.Expression, constants: Map<string, ts.Expression>): string[] {
  if (ts.isIdentifier(node)) return constants.has(node.text) ? emitNames(constants.get(node.text)!, constants) : [];
  if (ts.isArrayLiteralExpression(node)) return node.elements.filter(ts.isStringLiteral).map((e) => e.text);
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((p) => {
      if (ts.isSpreadAssignment(p)) return emitNames(p.expression, constants);
      return p.name && (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name)) ? [p.name.text] : [];
    });
  }
  return [];
}

function vueSurface(slug: string, component: string, constants: Map<string, ts.Expression>) {
  const file = parse(join(PACKAGES, 'vue/src/ui', `${slug}.ts`));
  let definition: ts.ObjectLiteralExpression | undefined;
  walk(file, (node) => {
    if (!ts.isCallExpression(node) || node.expression.getText() !== 'defineComponent') return;
    const options = node.arguments[0];
    if (options && ts.isObjectLiteralExpression(options) && options.properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText() === 'name' && ts.isStringLiteral(p.initializer) && p.initializer.text === component)) definition = options;
  });
  if (!definition) throw new Error(`packages/vue/src/ui/${slug}.ts defines no ${component}`);
  const emits = definition.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText() === 'emits');
  const names = emits ? emitNames(emits.initializer, constants) : [];
  const slots = new Set<string>();
  walk(definition, (node) => {
    if (ts.isPropertyAccessExpression(node) && node.expression.getText() === 'slots') slots.add(node.name.text);
  });
  const updates = names.filter((n) => n.startsWith('update:')).map((n) => n.slice('update:'.length));
  const value = updates.find((n) => n !== 'open');
  return {
    value: value === undefined ? undefined : value === 'modelValue' ? 'v-model' : `v-model:${value}`,
    open: updates.includes('open') ? 'v-model:open' : undefined,
    events: sorted(names.filter((n) => !n.startsWith('update:'))),
    slots: sorted(slots),
  };
}

/* ---------------------------------------------------------------- Angular */

const decoratorArgument = (node: ts.ClassDeclaration, name: string): ts.ObjectLiteralExpression | undefined => {
  for (const decorator of ts.getDecorators(node) ?? []) {
    const call = decorator.expression;
    if (ts.isCallExpression(call) && call.expression.getText() === name && call.arguments[0] && ts.isObjectLiteralExpression(call.arguments[0])) return call.arguments[0];
  }
  return undefined;
};

const stringProperty = (options: ts.ObjectLiteralExpression | undefined, name: string): string | undefined => {
  const property = options?.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText() === name);
  return property && ts.isStringLiteralLike(property.initializer) ? property.initializer.text : undefined;
};

interface AngularClass {
  readonly node: ts.ClassDeclaration;
  readonly selector?: string;
  readonly template?: string;
}

/** Every component and directive class of the Angular UI entry points, by class name. */
function angularClasses(): Map<string, AngularClass> {
  const classes = new Map<string, AngularClass>();
  const root = join(PACKAGES, 'angular/ui');
  for (const dir of readdirSync(root)) {
    if (!existsSync(join(root, dir, 'public-api.ts'))) continue;
    for (const name of readdirSync(join(root, dir)).filter((n) => n.endsWith('.ts'))) {
      parse(join(root, dir, name)).forEachChild((node) => {
        if (!ts.isClassDeclaration(node) || !node.name) return;
        const options = decoratorArgument(node, 'Component') ?? decoratorArgument(node, 'Directive');
        classes.set(node.name.text, { node, selector: stringProperty(options, 'selector'), template: stringProperty(options, 'template') });
      });
    }
  }
  return classes;
}

/** Class fields initialised by `model()` or `output()`, through the base classes. */
function signals(name: string, kind: 'model' | 'output', classes: Map<string, AngularClass>): string[] {
  const found = classes.get(name);
  if (!found) return [];
  const base = found.node.heritageClauses?.find((c) => c.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression.getText();
  const own = found.node.members.flatMap((member) => {
    if (!ts.isPropertyDeclaration(member) || !member.initializer || !ts.isCallExpression(member.initializer)) return [];
    const callee = member.initializer.expression;
    const called = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.expression.getText() : '';
    return called === kind ? [member.name.getText()] : [];
  });
  return [...(base ? signals(base, kind, classes) : []), ...own];
}

function angularSurface(component: string, classes: Map<string, AngularClass>) {
  const found = classes.get(component);
  if (!found?.selector) throw new Error(`packages/angular/ui has no component ${component}`);
  const models = signals(component, 'model', classes);
  const slots = new Set<string>();
  for (const match of found.template?.matchAll(/<ng-content(?:\s+select="\[(\w+)\]")?\s*\/>/g) ?? []) slots.add(match[1] ?? 'content');
  walk(found.node, (node) => {
    if (!ts.isCallExpression(node) || node.expression.getText() !== 'contentChild' || !node.arguments[0]) return;
    const directive = classes.get(node.arguments[0].getText())?.selector?.match(/\[(\w+)\]/)?.[1];
    if (directive) slots.add(directive);
  });
  const value = models.find((m) => m !== 'open');
  return {
    selector: found.selector.split(',')[0]!.trim(),
    value: value ? `[(${value})]` : undefined,
    open: models.includes('open') ? '[(open)]' : undefined,
    events: sorted(signals(component, 'output', classes)),
    slots: sorted(slots),
  };
}

/* ---------------------------------------------------------------- all three */

export function componentSurfaces(rows: readonly { readonly slug: string; readonly component: string }[]): Map<string, ComponentSurface> {
  const constants = vueConstants();
  const classes = angularClasses();
  const surfaces = new Map<string, ComponentSurface>();
  for (const { slug, component } of rows) {
    const react = reactSurface(slug, component);
    const vue = vueSurface(slug, component, constants);
    const angular = angularSurface(component, classes);
    const both = <K extends 'value' | 'open'>(key: K) =>
      react[key] && vue[key] && angular[key] ? { [key]: { react: react[key], vue: vue[key], angular: angular[key] } } : {};
    const binding: Binding = { ...both('value'), ...both('open') };
    surfaces.set(slug, {
      selector: angular.selector,
      ...(Object.keys(binding).length > 0 ? { binding } : {}),
      events: { react: react.events, vue: vue.events, angular: angular.events },
      slots: { react: react.slots, vue: vue.slots, angular: angular.slots },
    });
  }
  return surfaces;
}
