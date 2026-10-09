import type { HitArea } from '../types';

/**
 * The tree keyboard model, the WAI-ARIA tree pattern (REQ-438, DD-031), as `moves` on each hit
 * area: Down and Up to the next and previous node in depth-first pre-order, Right to the first
 * child (a leaf stays), Left to the parent (the root stays), Home and End to the first and last
 * node. Right always descends and Left always ascends, whatever the writing direction: the model
 * takes none, as the APG trees do. Only a chart that lays out a hierarchy imports this module, so
 * no other chart carries it (REQ-444); `stepActive` follows the moves.
 */
export function treeMoves(hits: readonly HitArea[]): HitArea[] {
  const order = hits.map((hit, i) => [hit, i] as const).sort((a, b) => (a[0].node?.order ?? 0) - (b[0].node?.order ?? 0));
  const indexOf = (id: string | null | undefined) => order.find(([hit]) => id !== null && hit.node?.id === id)?.[1];
  const first = order[0]?.[1];
  const last = order.at(-1)?.[1];
  return hits.map((hit, i) => {
    const position = order.findIndex(([, k]) => k === i);
    const id = hit.node?.id;
    const moves = {
      ArrowDown: order[position + 1]?.[1],
      ArrowUp: order[position - 1]?.[1],
      ArrowRight: order.find(([h]) => id !== undefined && h.node?.parent === id)?.[1],
      ArrowLeft: indexOf(hit.node?.parent),
      Home: first,
      End: last,
    };
    return { ...hit, moves: Object.fromEntries(Object.entries(moves).filter(([, to]) => to !== undefined)) as HitArea['moves'] };
  });
}

/**
 * The label a hierarchy item announces (DD-031): its path from the root, its value and, below the
 * root, its share of its parent — "Budget › Operations › Travel: 12,400, 8% of Operations". The
 * parts arrive formatted, so the readout, the table and the announcement say the same.
 */
export function treeLabel(path: readonly string[], value: string, share?: string): string {
  const head = `${path.join(' › ')}: ${value}`;
  const parent = path.at(-2);
  return share === undefined || parent === undefined ? head : `${head}, ${share} of ${parent}`;
}
