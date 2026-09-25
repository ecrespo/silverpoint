/**
 * Turns a `vitest bench --reporter=json` run into the nightly performance report (TD §2, TD §9:
 * "Performance · Vitest benchmarks · Nightly"). The budgets are reported, never enforced: shared
 * runners are too noisy for a 2 ms threshold to gate a pull request.
 */

/** PRD NFR Performance: geometry for a 100-point chart in < 2 ms. */
export const GEOMETRY_BUDGET_MS = 2;

/** PRD NFR Performance: full initial render of a card, inking included, in < 16 ms (one frame). */
export const RENDER_BUDGET_MS = 16;

/** Render benchmarks are named `render · <Chart>`; every other one times geometry. */
const budgetOf = (name: string) => (name.startsWith('render · ') ? RENDER_BUDGET_MS : GEOMETRY_BUDGET_MS);

interface Latency {
  readonly mean: number;
  readonly p99: number;
  readonly samplesCount: number;
}

interface BenchJson {
  readonly testResults: readonly {
    readonly assertionResults?: readonly {
      readonly benchmarks?: readonly { readonly tasks?: readonly { readonly name: string; readonly latency: Latency }[] }[];
    }[];
  }[];
}

export interface BenchRow extends Latency {
  readonly name: string;
}

export interface BenchReport {
  readonly rows: readonly BenchRow[];
  /** Benchmarks whose mean exceeds the budget. */
  readonly over: readonly string[];
  readonly markdown: string;
}

export function benchReport(json: BenchJson): BenchReport {
  const rows: BenchRow[] = json.testResults
    .flatMap((file) => file.assertionResults ?? [])
    .flatMap((test) => test.benchmarks ?? [])
    .flatMap((b) => b.tasks ?? [])
    .map((task) => ({ name: task.name, mean: task.latency.mean, p99: task.latency.p99, samplesCount: task.latency.samplesCount }))
    .sort((a, b) => b.mean - a.mean);
  const over = rows.filter((r) => r.mean > budgetOf(r.name)).map((r) => r.name);
  const head = `# Performance benchmarks — TD §2\n\nBudgets (PRD NFR Performance): ${GEOMETRY_BUDGET_MS} ms of geometry for a 100-point chart; ${RENDER_BUDGET_MS} ms for the full initial render of a card, inking included (\`render · …\`). Reported, not enforced.\n\n`;
  if (rows.length === 0) return { rows, over, markdown: `${head}No benchmark results in this run.\n` };
  const table = [
    '| Benchmark | mean (ms) | p99 (ms) | samples | budget | verdict |',
    '|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.name} | ${r.mean.toFixed(3)} | ${r.p99.toFixed(3)} | ${r.samplesCount} | ${budgetOf(r.name)} ms | ${r.mean > budgetOf(r.name) ? '**over**' : 'within'} |`),
  ].join('\n');
  const verdict = over.length === 0 ? 'Every benchmark is within budget.' : `Over budget: ${over.join(', ')}.`;
  return { rows, over, markdown: `${head}${table}\n\n${verdict}\n` };
}
