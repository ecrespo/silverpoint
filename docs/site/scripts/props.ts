/**
 * The props reference of the documentation site, read from the published types with the
 * TypeScript compiler: names, types, optionality and JSDoc, never retyped by hand (T-097).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { CATALOG } from '../../../tools/visual-gate/catalog';

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
}

const PROPS = fileURLToPath(new URL('../../../packages/core/src/types/props.ts', import.meta.url));

/** Every interface of a source file, by name, with its property signatures documented. */
export function interfacesIn(source: string): Map<string, PropDoc[]> {
  const file = ts.createSourceFile('props.ts', source, ts.ScriptTarget.Latest, true);
  const found = new Map<string, PropDoc[]>();
  file.forEachChild((node) => {
    if (!ts.isInterfaceDeclaration(node)) return;
    const members = node.members.filter(ts.isPropertySignature).map((member) => ({
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
    }));
    found.set(node.name.text, members);
  });
  return found;
}

export function propsReference(): PropsReference {
  const interfaces = interfacesIn(readFileSync(PROPS, 'utf8'));
  const own = (name: string) => {
    const members = interfaces.get(name);
    if (!members) throw new Error(`packages/core/src/types/props.ts has no ${name}`);
    return members;
  };
  return {
    common: own('CommonChartProps'),
    charts: CATALOG.map(({ chart }) => ({ chart, own: own(`${chart}Props`) })),
  };
}
