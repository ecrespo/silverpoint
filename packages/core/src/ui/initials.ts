/** An avatar's initials (REQ-478): the first letters of the first two words, upper-cased; '?' for none. */
export function uiInitials(name: string | undefined): string {
  const words = (name ?? '').replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => [...word][0]!.toUpperCase()).join('') || '?';
}
