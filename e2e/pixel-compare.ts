import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/* The comparisons of Constitution Art. 3, shared by the pixel specs (charts, dashboards, UI, decks). */

/** Pixels differing beyond `threshold` (pixelmatch's YIQ distance, as Playwright uses it). */
export function compare(actual: Buffer, expected: Buffer, threshold: number): { pixels: number; ratio: number } {
  const a = PNG.sync.read(actual);
  const b = PNG.sync.read(expected);
  if (a.width !== b.width || a.height !== b.height) return { pixels: Number.POSITIVE_INFINITY, ratio: 1 };
  const pixels = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold });
  return { pixels, ratio: pixels / (a.width * a.height) };
}

/** The three comparisons of Constitution Art. 3; returns the ones that fail. */
export function gate(adapter: Buffer, canonical: Buffer, golden: Buffer | undefined): string[] {
  const failures: string[] = [];
  const same = compare(adapter, canonical, 0.1);
  if (same.ratio > 0.001) failures.push(`vs canonical: ${same.pixels} px (${same.ratio}) beyond 0.10`);
  if (compare(adapter, canonical, 0.5).pixels > 0) failures.push('vs canonical: a pixel beyond 0.50');
  if (golden) {
    const stored = compare(adapter, golden, 0.15);
    if (stored.ratio > 0.005) failures.push(`vs golden: ${stored.pixels} px (${stored.ratio}) beyond 0.15`);
    if (compare(adapter, golden, 0.5).pixels > 0) failures.push('vs golden: a pixel beyond 0.50');
  }
  return failures;
}

