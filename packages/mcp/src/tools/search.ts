/**
 * `search_catalog` (API delta §3, REQ-539): a token match over names, summaries, prop docs and
 * diagnostics, best first. No index beyond the catalog and no ranking model: identical input,
 * identical output (Art. 4).
 */
import type { Catalog } from '../catalog';

export type HitKind = 'chart' | 'component' | 'prop' | 'diagnostic';

export interface Hit {
  readonly kind: HitKind;
  readonly slug: string;
  readonly title: string;
  readonly snippet: string;
}

export interface SearchInput {
  readonly query: string;
  readonly limit?: number;
}

export const SEARCH_LIMIT = { default: 10, max: 20 } as const;

interface Document extends Hit {
  /** Name fields weigh more than prose. */
  readonly names: string;
  readonly text: string;
}

/** `sourceKey` → `source key`, `sankey-chart` → `sankey chart`: tokens as an agent types them. */
const words = (text: string) =>
  text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const cache = new WeakMap<Catalog, readonly Document[]>();

function documents(catalog: Catalog): readonly Document[] {
  const cached = cache.get(catalog);
  if (cached) return cached;
  const docs: Document[] = [];
  for (const chart of catalog.data.charts) {
    const names = [chart.slug, ...Object.values(chart.names)].join(' ');
    docs.push({ kind: 'chart', slug: chart.slug, title: chart.names.react, snippet: chart.summary, names, text: `${chart.summary} ${chart.intents.join(' ')} ${chart.family} ${chart.data.shape}` });
  }
  for (const component of catalog.data.components) {
    const names = [component.slug, ...Object.values(component.names)].join(' ');
    docs.push({ kind: 'component', slug: component.slug, title: component.names.react, snippet: component.summary, names, text: `${component.summary} ${component.group} ${component.family}` });
  }
  for (const entry of [...catalog.data.charts, ...catalog.data.components]) {
    for (const prop of entry.props) {
      docs.push({ kind: 'prop', slug: `${entry.slug}.${prop.name}`, title: `${entry.names.react} ${prop.name}`, snippet: prop.doc, names: `${prop.name} ${prop.reflex ?? ''}`, text: `${prop.doc} ${prop.type}` });
    }
  }
  for (const d of catalog.data.diagnostics) {
    docs.push({ kind: 'diagnostic', slug: d.code, title: d.code, snippet: `${d.what}. ${d.todo}`, names: `${d.code} ${d.req}`, text: `${d.what} ${d.todo}` });
  }
  cache.set(catalog, docs);
  return docs;
}

const KIND_ORDER: Readonly<Record<HitKind, number>> = { chart: 0, component: 1, diagnostic: 2, prop: 3 };

export function searchCatalog(catalog: Catalog, input: SearchInput): { hits: Hit[] } {
  const limit = Math.max(1, Math.min(SEARCH_LIMIT.max, Math.floor(input.limit ?? SEARCH_LIMIT.default)));
  const query = [...new Set(words(input.query))];
  if (query.length === 0) return { hits: [] };
  const scored = documents(catalog).flatMap((doc, order) => {
    const names = new Set(words(doc.names));
    const text = new Set(words(doc.text));
    let score = 0;
    for (const token of query) {
      if (names.has(token)) score += 3;
      else if ([...names].some((n) => n.startsWith(token))) score += 2;
      else if (text.has(token)) score += 1;
    }
    if (score === 0) return [];
    return [{ doc, score, order }];
  });
  scored.sort((a, b) => b.score - a.score || KIND_ORDER[a.doc.kind] - KIND_ORDER[b.doc.kind] || a.order - b.order);
  return { hits: scored.slice(0, limit).map(({ doc: { kind, slug, title, snippet } }) => ({ kind, slug, title, snippet })) };
}
