import { test } from 'vitest';
import { createPrng } from '../src/render/prng';
import { packSwarm } from '../src/charts/shared/beeswarm';
import { kde, silverman } from '../src/charts/shared/density';
import { bins, ecdf, fiveNumber, sortedValues } from '../src/charts/shared/stats';
import type { HierarchyRow } from '../src/charts/shared/contracts';
import { partition, squarify, stratify, tidyTree, type TreeNode } from '../src/charts/shared/hierarchy';
import { contours, densityGrid } from '../src/charts/shared/field';
import { triangulate, voronoiCells } from '../src/charts/shared/delaunay';
import { layoutNetwork } from '../src/charts/shared/network';

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

/** T-190: a field at its ceiling, 60 × 60, five levels; a cloud at its ceiling, 10 000 points. */
const FIELD = { nx: 60, ny: 60, values: Array.from({ length: 3600 }, (_, k) => ((k % 60) * (k % 60) - 30 * (k % 60) + Math.floor(k / 60) * 17) % 97) };
const CLOUD = Array.from({ length: 10_000 }, () => ({ x: random() * 100, y: random() * 100 }));
/** T-190: a triangulation at its ceiling, 500 points on the 2-decimal grid. */
const SITES = Array.from({ length: 500 }, () => ({ x: Math.round(random() * 60_000) / 100, y: Math.round(random() * 40_000) / 100 }));

/** T-195: a network at its ceiling, 150 nodes and 600 links, the default 300 iterations (16 ms). */
const LINKS = Array.from({ length: 600 }, () => ({ source: Math.floor(random() * 150), target: Math.floor(random() * 150) }));

const CASES: Record<string, () => unknown> = {
  'network of 150 nodes and 600 links, 300 iterations': () => layoutNetwork(150, LINKS, { iterations: 300, seed: 426 }),
  'field of 60 × 60: contours at five levels': () => contours(FIELD, [10, 30, 50, 70, 90]),
  'field of 60 × 60: density of 10 000 points': () => densityGrid(CLOUD, { x: [0, 100], y: [0, 100] }, 60, 60, { x: 6, y: 6 }),
  'delaunay of 500': () => triangulate(SITES),
  'voronoi of 500': () => voronoiCells(SITES, triangulate(SITES), { x: 0, y: 0, width: 600, height: 400 }),
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
