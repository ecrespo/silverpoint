/**
 * REQ-203 (TD DD-014): the dashboard stylesheet may not reorder cells or place them on explicit
 * grid lines, so the DOM order stays the reading order at every breakpoint. Checked by
 * `check-dashboard-css.test.ts` over the shipped `packages/grounds/src/dashboard.css`.
 */

/** Declarations that reorder or place, each with the reason reported. */
const FORBIDDEN = [
  [/^order$/, 'reorders a cell'],
  [/^grid-(row|column)-(start|end)$/, 'places a cell on an explicit line'],
  [/^grid-area$/, 'places a cell in a named area'],
  [/^grid-template-areas$/, 'declares placement areas'],
];

/** One line per violation in `css`; comments are ignored. */
export function dashboardCssViolations(css) {
  const problems = [];
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of plain.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)) {
    const property = match[1].toLowerCase();
    const value = match[2].trim();
    for (const [pattern, reason] of FORBIDDEN) {
      if (pattern.test(property)) problems.push(`${property}: ${value} — ${reason} (REQ-203)`);
    }
    if (property === 'grid-auto-flow' && /\bdense\b/.test(value)) problems.push(`${property}: ${value} — dense packing pulls later cells forward (REQ-203)`);
    if ((property === 'grid-column' || property === 'grid-row') && !/^span\s/.test(value)) {
      problems.push(`${property}: ${value} — only \`span …\` is allowed; anything else places a cell on a line (REQ-203)`);
    }
  }
  return problems;
}
