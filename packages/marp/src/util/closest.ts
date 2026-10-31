/** Edit distance (Levenshtein), for "did you mean" suggestions only. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length]!;
}

/** Up to `limit` candidates within a third of the word's length (at least 2 edits), nearest first, stable. */
export function closest(word: string, candidates: readonly string[], limit = 3): string[] {
  const max = Math.max(2, Math.floor(word.length / 3));
  return candidates
    .map((candidate, order) => ({ candidate, order, d: distance(word.toLowerCase(), candidate.toLowerCase()) }))
    .filter((c) => c.d <= max)
    .sort((x, y) => x.d - y.d || x.order - y.order)
    .slice(0, limit)
    .map((c) => c.candidate);
}

/** ` Did you mean "a" or "b"?`, or nothing. */
export function didYouMean(word: string, candidates: readonly string[]): string {
  const near = closest(word, candidates);
  if (near.length === 0) return '';
  return ` Did you mean ${near.map((n) => `"${n}"`).join(' or ')}?`;
}
