import { test } from 'vitest';
import { createPrng } from '../src/render/prng';
import { packSwarm } from '../src/charts/shared/beeswarm';
import { kde, silverman } from '../src/charts/shared/density';
import { bins, ecdf, fiveNumber, sortedValues } from '../src/charts/shared/stats';
import type { HierarchyRow } from '../src/charts/shared/contracts';
import { partition, squarify, stratify, tidyTree, type TreeNode } from '../src/charts/shared/hierarchy';

/**
 * REQ-445: a statistic over 1 000 observations in < 4 ms, sort included. Reported nightly by
 * `tools/bench-report`; nothing here fails on time.
 */
const random = createPrng(445);
const OBSERVATIONS = Array.from({ length: 1000 }, () => Math.round((random() + random() + random()) * random() * 10_000) / 100);

/** T-171: a beeswarm at its ceiling, 500 points on a 400 px axis. */
const SWARM = ((sample: readonly number[]) => sample.map((v) => (v / Math.max(...sample)) * 400).sort((a, b) => a - b))(OBSERVATIONS.slice(0, 500));

/** T-180: a hierarchy at its ceiling, 500 nodes, five children each down to the leaves. */
const NODES: HierarchyRow[] = Array.from({ length: 500 }, (_, i) => ({
  id: `n${i}`,
  parent: i === 0 ? null : `n${Math.floor((i - 1) / 5)}`,
  value: 1 + (i % 7),
  label: `N${i}`,
  index: i,
  datum: {},
}));

/** Squarify every internal node's children inside its tile, as the treemap does. */
function treemap(root: TreeNode): number {
  let tiles = 0;
  const walk = (node: TreeNode, rect: { x: number; y: number; width: number; height: number }) => {
    const inner = squarify(node.children.map((c) => c.value), rect);
    tiles += inner.length;
    node.children.forEach((child, i) => walk(child, inner[i] as typeof rect));
  };
  walk(root, { x: 0, y: 0, width: 640, height: 300 });
  return tiles;
}

const CASES: Record<string, () => unknown> = {
  'hierarchy of 500: stratify and squarify': () => treemap(stratify(NODES, 'value') as TreeNode),
  'hierarchy of 500: stratify and partition': () => partition(stratify(NODES, 'value') as TreeNode),
  'hierarchy of 500: stratify and tidy tree': () => tidyTree(stratify(NODES, 'data') as TreeNode),
  'beeswarm packing of 500': () => packSwarm(SWARM, 3, 1),
  'bins of 1 000': () => bins(sortedValues(OBSERVATIONS)),
  'five-number summary of 1 000': () => fiveNumber(sortedValues(OBSERVATIONS)),
  'ecdf of 1 000': () => ecdf(sortedValues(OBSERVATIONS)),
  'kde of 1 000': () => {
    const sorted = sortedValues(OBSERVATIONS);
    const h = silverman(sorted);
    return kde(sorted, h, [(sorted[0] as number) - h, (sorted.at(-1) as number) + h]);
  },
};

for (const [name, run] of Object.entries(CASES)) {
  test(`REQ-445 · ${name}`, async ({ bench }) => {
    await bench(`stats · ${name}`, run).run();
  });
}
