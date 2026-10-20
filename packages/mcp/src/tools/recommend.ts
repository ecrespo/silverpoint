/**
 * `recommend_chart` (API delta §3, REQ-540, DD-046): the catalog's table read deterministically.
 * The rule for the shape and intent ranks its charts; the description of the data adjusts them;
 * any other chart that fits the shape or the intent stays below every curated one.
 */
import type { Catalog } from '../catalog';
import type { RecommendRule } from '../types';

export interface RecommendInput {
  readonly shape: string;
  readonly intent: string;
  /** How many rows the data holds. */
  readonly rows?: number;
  /** The fields of a row; numeric ones count as value fields. */
  readonly fields?: readonly { readonly name: string; readonly type: 'string' | 'number' | 'date' | 'boolean' }[];
}

export interface Recommendation {
  readonly slug: string;
  readonly score: number;
  readonly reasons: readonly string[];
}

export const RECOMMEND_LIMIT = 5;

/** Scores for charts outside the rule, below the lowest a rule gives (0.3). */
const FALLBACK = { both: 0.25, intent: 0.15, shape: 0.1 } as const;

function applies(adjust: NonNullable<RecommendRule['adjust']>[number], rows: number | undefined, values: number | undefined): boolean {
  if (adjust.when === 'values>') return values !== undefined && values > adjust.n;
  if (rows === undefined) return false;
  return adjust.when === 'rows>' ? rows > adjust.n : rows < adjust.n;
}

export function recommendChart(catalog: Catalog, input: RecommendInput): { recommendations: Recommendation[] } {
  const shape = catalog.shape(input.shape);
  const intent = catalog.intent(input.intent);
  const values = input.fields?.filter((f) => f.type === 'number').length;
  const found = new Map<string, { score: number; reasons: string[] }>();
  const rule = catalog.data.recommend.find((r) => r.shape === shape && r.intent === intent);
  for (const chart of rule?.charts ?? []) found.set(chart.slug, { score: chart.score, reasons: [chart.reason] });
  for (const adjust of rule?.adjust ?? []) {
    const entry = found.get(adjust.slug);
    if (!entry || !applies(adjust, input.rows, values)) continue;
    entry.score += adjust.delta;
    entry.reasons.push(adjust.reason);
  }
  for (const chart of catalog.data.charts) {
    if (found.has(chart.slug)) continue;
    const fitsShape = chart.data.shape === shape;
    const fitsIntent = chart.intents.includes(intent);
    if (!fitsShape && !fitsIntent) continue;
    const score = fitsShape && fitsIntent ? FALLBACK.both : fitsIntent ? FALLBACK.intent : FALLBACK.shape;
    const reason = fitsShape && fitsIntent ? `Draws ${shape} data for ${intent}.` : fitsIntent ? `Serves ${intent}, with its data reshaped.` : `Draws ${shape} data.`;
    found.set(chart.slug, { score, reasons: [reason] });
  }
  const order = new Map(catalog.data.charts.map((c, i) => [c.slug, i]));
  const recommendations = [...found]
    .map(([slug, { score, reasons }]) => ({ slug, score: Math.round(Math.max(0, Math.min(1, score)) * 100) / 100, reasons }))
    .sort((a, b) => b.score - a.score || order.get(a.slug)! - order.get(b.slug)!)
    .slice(0, RECOMMEND_LIMIT);
  return { recommendations };
}
