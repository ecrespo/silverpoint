/**
 * The tools' error contract (API delta §3, REQ-549, REQ-560): a tool error the client reads as data,
 * with a code and, for a name it does not know, the closest names it does.
 */
export type ToolErrorCode = 'unknown_name' | 'invalid_input' | 'limit_exceeded' | 'render_failed';

export class ToolError extends Error {
  readonly code: ToolErrorCode;
  readonly suggestions: readonly string[];

  constructor(code: ToolErrorCode, message: string, suggestions: readonly string[] = []) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.suggestions = suggestions;
  }
}

/** Edit distance, for the closest valid names (REQ-549). */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length]!;
}

/** Up to `limit` candidates closest to `name`: prefix and substring matches first, then by edit distance. */
export function closest(name: string, candidates: readonly string[], limit = 3): string[] {
  const wanted = name.toLowerCase();
  const scored = [...new Set(candidates)].map((candidate, order) => {
    const lower = candidate.toLowerCase();
    const contains = lower.startsWith(wanted) || wanted.startsWith(lower) ? 0 : lower.includes(wanted) || wanted.includes(lower) ? 1 : 2;
    // Against the candidate's head as long as the name too, so `sankie` finds `sankey-chart`.
    return { candidate, contains, head: distance(wanted, lower.slice(0, wanted.length)), distance: distance(wanted, lower), order };
  });
  scored.sort((a, b) => a.contains - b.contains || a.head - b.head || a.distance - b.distance || a.order - b.order);
  return scored.slice(0, limit).map((s) => s.candidate);
}

export function unknownName(kind: string, name: string, candidates: readonly string[]): ToolError {
  return new ToolError('unknown_name', `No ${kind} named "${name}".`, closest(name, candidates));
}
