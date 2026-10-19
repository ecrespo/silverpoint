export interface Rule {
  readonly selector: string;
  readonly body: string;
  /** Enclosing at-rules, outermost first. */
  readonly media: readonly string[];
}

/** A small CSS reader: enough for the stylesheet this package writes (no comments inside rules). */
export function rules(text: string): Rule[] {
  const out: Rule[] = [];
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const walk = (chunk: string, media: string[]) => {
    let i = 0;
    while (i < chunk.length) {
      const open = chunk.indexOf('{', i);
      if (open < 0) break;
      const prelude = chunk.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (depth > 0 && j < chunk.length) {
        if (chunk[j] === '{') depth++;
        else if (chunk[j] === '}') depth--;
        j++;
      }
      const inner = chunk.slice(open + 1, j - 1);
      if (prelude.startsWith('@')) walk(inner, [...media, prelude]);
      else out.push({ selector: prelude, body: inner, media });
      i = j;
    }
  };
  walk(stripped, []);
  return out;
}

/** Declarations of a rule, with every `url(…)` blanked so a data URI's bytes are not read as CSS. */
export const declarations = (rule: Rule) =>
  rule.body
    .replace(/url\("[^"]*"\)/g, 'url()')
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const at = d.indexOf(':');
      return { property: d.slice(0, at).trim(), value: d.slice(at + 1).trim() };
    });
