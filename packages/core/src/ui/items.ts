import { diagnose } from '../diagnostics/diagnose';

/**
 * Keeps the first item of each key and skips later ones, and any item without a key, warning
 * `SP019` without throwing (REQ-325). Returns the input itself when every key is unique.
 */
export function uiItems<T extends { readonly key: string }>(items: readonly T[], component: string): readonly T[] {
  const seen = new Set<string>();
  const kept: T[] = [];
  for (const item of items) {
    if (item.key !== '' && !seen.has(item.key)) {
      seen.add(item.key);
      kept.push(item);
    } else if (process.env.NODE_ENV !== 'production') {
      const why = item.key === '' ? 'An item has an empty key' : `The key "${item.key}" repeats`;
      diagnose('SP019', component, { property: 'items', message: `${why}; that item is skipped.` });
    }
  }
  return kept.length === items.length ? items : kept;
}
