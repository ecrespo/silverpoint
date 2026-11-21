/** `hostCatalogFollows` (REQ-658): a pinned host catalog follows the library on the same major.minor. */
const line = (version: string): string | undefined => /^(\d+)\.(\d+)\.\d+/.exec(version)?.slice(1, 3).join('.');

export function hostCatalogFollows(pinned: string, current: string): boolean {
  const a = line(pinned);
  return a !== undefined && a === line(current);
}
