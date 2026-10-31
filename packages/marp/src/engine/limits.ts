/**
 * The deck's limits (REQ-576): past one, the deck renders up to it and raises `SP029` once,
 * naming it — never a throw, so a long deck still shows (Art. 5).
 */
import { diagnose } from '@silverpoint/core';
import type { DeckDiagnostic } from '../types';

export const DECK_LIMITS = Object.freeze({ bytes: 512 * 1024, slides: 300, fences: 60 });

const NAMES = { bytes: '512 KB', slides: '300 slides', fences: '60 chart fences' } as const;
const RENDERS = { bytes: 'it is cut at its last line break inside the limit', slides: 'only the first 300 render', fences: 'only the first 60 render; the others are left out' } as const;

/** Raises `SP029` for a limit, once per render. */
export function raiseLimit(diagnostics: DeckDiagnostic[], limit: keyof typeof NAMES, slide?: number): void {
  const message = `The deck exceeds ${NAMES[limit]}: ${RENDERS[limit]}.`;
  if (diagnostics.some((d) => d.code === 'SP029' && d.message === message)) return;
  diagnose('SP029', 'SpDeck', { property: 'markdown', message });
  diagnostics.push({ code: 'SP029', severity: 'warn', message, ...(slide === undefined ? {} : { slide }) });
}

/** The Markdown cut to the byte limit at its last line break, or as given. */
export function withinBytes(markdown: string): { readonly markdown: string; readonly cut: boolean } {
  const bytes = new TextEncoder().encode(markdown);
  if (bytes.length <= DECK_LIMITS.bytes) return { markdown, cut: false };
  const head = new TextDecoder().decode(bytes.subarray(0, DECK_LIMITS.bytes));
  const end = head.lastIndexOf('\n');
  return { markdown: end === -1 ? head.replace(/�$/, '') : head.slice(0, end + 1), cut: true };
}
