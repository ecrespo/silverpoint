/**
 * The props reference of the documentation site and of the agent catalog (DD-045), read from the
 * published types with the TypeScript compiler: names, types, optionality and JSDoc, never retyped
 * by hand (T-097, T-226).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { UI_COMPONENTS } from '../../packages/core/src/ui/catalog';
import { CATALOG } from '../visual-gate/catalog';

export interface PropDoc {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
  readonly doc: string;
}

export interface PropsReference {
  /** Props every chart takes (`CommonChartProps`). */
  readonly common: readonly PropDoc[];
  /** Each catalog chart's own props, in catalog order. */
  readonly charts: readonly { readonly chart: string; readonly own: readonly PropDoc[] }[];
  /** The dashboard composition (API Spec §7.1): its props, its layout and a layout cell. */
  readonly dashboard: { readonly props: readonly PropDoc[]; readonly layout: readonly PropDoc[]; readonly cell: readonly PropDoc[] };
  /** The UI components (API Spec §7.2, REQ-332): the props all take, and each one's own. */
  readonly ui: {
    readonly common: readonly PropDoc[];
    readonly components: readonly { readonly slug: string; readonly name: string; readonly group: string; readonly own: readonly PropDoc[] }[];
  };
  /** The fields of a `Palette` (REQ-460). */
  readonly palette: readonly PropDoc[];
  /** `SpTimeline`'s own props (REQ-510); it takes the common UI props too. */
  readonly timeline: readonly PropDoc[];
}

const PROPS = fileURLToPath(new URL('../../packages/core/src/types/props.ts', import.meta.url));
const UI_TYPES = fileURLToPath(new URL('../../packages/core/src/ui/types.ts', import.meta.url));
const DASHBOARD = fileURLToPath(new URL('../../packages/core/src/dashboard/types.ts', import.meta.url));
const PALETTE = fileURLToPath(new URL('../../packages/core/src/palette/palette.ts', import.meta.url));
const TIMELINE = fileURLToPath(new URL('../../packages/core/src/timeline/types.ts', import.meta.url));

/** Every interface and object type alias of a source file, by name, with its property signatures documented. */
export function interfacesIn(source: string): Map<string, PropDoc[]> {
  const file = ts.createSourceFile('props.ts', source, ts.ScriptTarget.Latest, true);
  const found = new Map<string, PropDoc[]>();
  const aliases = new Map<string, ts.TypeNode>();
  file.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type);
  });
  const docOf = (member: ts.PropertySignature) => ({
      name: member.name.getText(file),
      type: member.type?.getText(file).replace(/\s+/g, ' ') ?? 'unknown',
      optional: member.questionToken !== undefined,
      doc: ts
        .getJSDocCommentsAndTags(member)
        .filter(ts.isJSDoc)
        .map((jsdoc) => ts.getTextOfJSDocComment(jsdoc.comment) ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
  });
  /** The members of a type alias: its object literals, through intersections, unions and local aliases, first one wins. */
  const membersOf = (type: ts.TypeNode, seen = new Map<string, PropDoc>()): Map<string, PropDoc> => {
    if (ts.isTypeLiteralNode(type)) {
      for (const member of type.members.filter(ts.isPropertySignature)) {
        const prop = docOf(member);
        // A name every branch of a union makes optional is optional: `title` or `label`.
        if (!seen.has(prop.name)) seen.set(prop.name, prop);
      }
    } else if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) {
      for (const part of type.types) membersOf(part, seen);
      if (ts.isUnionTypeNode(type)) for (const [name, prop] of seen) if (!type.types.every((t) => ts.isTypeLiteralNode(t) && t.members.some((m) => m.name?.getText(file) === name && !(m as ts.PropertySignature).questionToken))) seen.set(name, { ...prop, optional: true });
    } else if (ts.isTypeReferenceNode(type) && aliases.has(type.typeName.getText(file))) {
      membersOf(aliases.get(type.typeName.getText(file)) as ts.TypeNode, seen);
    }
    return seen;
  };
  /** Local interfaces each interface extends; the shared `Common*` bases are listed on their own. */
  const bases = new Map<string, string[]>();
  file.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) {
      found.set(node.name.text, node.members.filter(ts.isPropertySignature).map(docOf));
      const extended = (node.heritageClauses ?? []).flatMap((clause) => clause.types.map((type) => type.expression.getText(file)));
      bases.set(node.name.text, extended.filter((name) => !name.startsWith('Common')));
    } else if (ts.isTypeAliasDeclaration(node)) {
      const members = [...membersOf(node.type).values()];
      if (members.length > 0) found.set(node.name.text, members);
    }
  });
  /** An interface's members after those it inherits from a local base, its own redeclarations winning. */
  const flattened = (name: string): PropDoc[] => {
    const own = found.get(name) ?? [];
    const inherited = (bases.get(name) ?? []).filter((base) => found.has(base)).flatMap(flattened);
    return [...inherited.filter((prop) => !own.some((o) => o.name === prop.name)), ...own];
  };
  for (const name of bases.keys()) found.set(name, flattened(name));
  return found;
}

export function propsReference(): PropsReference {
  const interfaces = interfacesIn(readFileSync(PROPS, 'utf8'));
  const own = (name: string) => {
    const members = interfaces.get(name);
    if (!members) throw new Error(`packages/core/src/types/props.ts has no ${name}`);
    return members;
  };
  const dashboard = interfacesIn(readFileSync(DASHBOARD, 'utf8'));
  const fromDashboard = (name: string) => {
    const members = dashboard.get(name);
    if (!members) throw new Error(`packages/core/src/dashboard/types.ts has no ${name}`);
    return members;
  };
  const ui = interfacesIn(readFileSync(UI_TYPES, 'utf8'));
  const fromUi = (name: string) => {
    const members = ui.get(name);
    if (!members) throw new Error(`packages/core/src/ui/types.ts has no ${name}`);
    return members;
  };
  return {
    common: own('CommonChartProps'),
    charts: CATALOG.map(({ chart }) => ({ chart, own: own(`${chart}Props`) })),
    dashboard: { props: fromDashboard('DashboardProps'), layout: fromDashboard('DashboardLayout'), cell: fromDashboard('DashboardCellLayout') },
    ui: {
      common: fromUi('CommonUiProps'),
      components: UI_COMPONENTS.map(({ slug, component, group }) => ({ slug, name: component, group, own: fromUi(`${component}Props`) })),
    },
    palette: interfacesIn(readFileSync(PALETTE, 'utf8')).get('Palette') ?? [],
    timeline: interfacesIn(readFileSync(TIMELINE, 'utf8')).get('SpTimelineProps') ?? [],
  };
}
