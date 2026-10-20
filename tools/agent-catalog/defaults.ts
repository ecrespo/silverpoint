/**
 * Default values for the agent catalog (REQ-530), never typed here: a chart's own fallback
 * literal in the core (`props.sourceKey ?? 'source'`), the table of API Spec §5.1 for the props every
 * chart or component shares, or what the prop's JSDoc states.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** `props.<name> ?? <literal>` in a chart's own sources, the first one of each name. */
export function chartFallbacks(slug: string): Map<string, string> {
  const dir = join(ROOT, 'packages/core/src/charts', slug);
  const found = new Map<string, string>();
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.ts') && !n.endsWith('.test.ts')).sort()) {
    const file = ts.createSourceFile(name, readFileSync(join(dir, name), 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
        const left = node.left;
        if (ts.isPropertyAccessExpression(left) && left.expression.getText(file) === 'props' && isLiteral(node.right) && !found.has(left.name.text)) {
          found.set(left.name.text, node.right.getText(file));
        }
      }
      node.forEachChild(visit);
    };
    visit(file);
  }
  return found;
}

function isLiteral(node: ts.Expression): boolean {
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return true;
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return true;
  if (ts.isPrefixUnaryExpression(node)) return ts.isNumericLiteral(node.operand);
  if (ts.isArrayLiteralExpression(node)) return node.elements.length > 0 && node.elements.every(isLiteral);
  return false;
}

/** `| \`prop\` | \`value\` | … |` rows of API Spec §5.1 whose default is one literal. */
export function specDefaults(): Map<string, string> {
  const spec = readFileSync(join(ROOT, 'specs/api-spec.md'), 'utf8');
  const section = spec.split(/^### 5\.1 Default values$/m)[1]?.split(/^## /m)[0] ?? '';
  const found = new Map<string, string>();
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    const name = cells[1]?.match(/^`(\w+)`$/)?.[1];
    const value = cells[2]?.match(/^`([^`]+)`$/)?.[1];
    if (name && value && !found.has(name)) found.set(name, value);
  }
  return found;
}

/** A default the JSDoc states: "Default `x`", "`x` by default", "300 by default". */
export function docDefault(doc: string): string | undefined {
  return (
    doc.match(/\bDefault `([^`]+)`/)?.[1] ??
    doc.match(/`([^`]+)` by default/)?.[1] ??
    doc.match(/(?:^|[;.(]\s*)(-?\d+(?:\.\d+)?) by default/)?.[1] ??
    undefined
  );
}
