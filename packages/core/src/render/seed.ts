import type { Seed } from '../types';

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

/**
 * 32-bit FNV-1a over the UTF-8 bytes of the input (DD-006).
 *
 * Frozen by SemVer: changing it changes every derived seed, and with it every golden image.
 */
export function fnv1a32(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (const byte of utf8Bytes(input)) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** Derives the seed of a chart from its identifier (REQ-003). */
export function deriveSeed(id: string): number {
  return fnv1a32(id);
}

/** `seed ?? derive(id)`, with string seeds hashed and numbers taken as unsigned 32-bit. */
export function resolveSeed(seed: Seed | undefined, id: string): number {
  if (seed === undefined) return deriveSeed(id);
  if (typeof seed === 'string') return fnv1a32(seed);
  return Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
}
