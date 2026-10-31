import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint, slideBackdrop } from '../src';
import { BACKDROP_STROKE_WIDTH } from '../src/backdrop';

/*
 * A slide's inked backdrop (T-260, REQ-587, DD-055, Data Model §2.36): a standalone SVG —it is a
 * CSS data URI, so it carries the ground's colours itself— drawn by the ground's own inker.
 */

const size = { width: 1280, height: 720 };
const opts = (kind: 'plain' | 'hatched' | 'plate', mode: 'ink' | 'precision' = 'ink', seed = 7) => ({ kind, mode, seed, ...size });
const r2 = (n: number) => Math.round(n * 100) / 100;
const paths = (svg: string) => svg.match(/<path [^>]*>/g) ?? [];

describe('slideBackdrop (T-260)', () => {
  test('REQ-587 · a standalone SVG of the slide size, painted with the substrate; its data URI', () => {
    const { svg, dataUri } = slideBackdrop(silverpoint, 'cream', opts('plain'));
    expect(svg).toBe(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><rect width="1280" height="720" fill="${silverpoint.substrates.cream}"/></svg>`);
    expect(dataUri).toBe(`data:image/svg+xml,${encodeURIComponent(svg)}`);
  });

  test('REQ-587 · plate: two rules 24 and 30 px inside the edge, exact in precision', () => {
    const { svg } = slideBackdrop(silverpoint, 'cream', opts('plate', 'precision'));
    const rule = `fill="none" stroke="${silverpoint.ink.rule}" stroke-width="${BACKDROP_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"`;
    expect(paths(svg)).toEqual([`<path d="M24 24H1256V696H24Z" ${rule}/>`, `<path d="M30 30H1250V690H30Z" ${rule}/>`]);
  });

  test('REQ-587 · plate in ink: the ground’s inker redraws the rules by hand', () => {
    const { svg } = slideBackdrop(silverpoint, 'cream', opts('plate'));
    expect(paths(svg)).toHaveLength(2);
    expect(svg).not.toContain('d="M24 24H1256V696H24Z"');
    expect(svg).toContain(`stroke="${silverpoint.ink.rule}"`);
  });

  test('REQ-587 · hatched: a 32 px band filled with the ground’s tonal level 1 tile', () => {
    const { svg } = slideBackdrop(silverpoint, 'cream', opts('hatched'));
    expect(svg).toMatch(/<defs><pattern id="sp-backdrop-tone-1" width="[\d.]+" height="[\d.]+" patternUnits="userSpaceOnUse" patternTransform="rotate\([-\d.]+\)">(<path [^>]*\/>)+<\/pattern><\/defs>/);
    expect(svg).toContain('<path d="M0 0H1280V720H0ZM32 32V688H1248V32Z" fill="url(#sp-backdrop-tone-1)" stroke="none"/>');
    expect(svg).toContain(`stroke="${silverpoint.ink.primary}" stroke-width="${r2(BACKDROP_STROKE_WIDTH * 0.6)}"`);
  });

  test('REQ-587 · hatched in precision: the band’s exact outline, no tile', () => {
    const { svg } = slideBackdrop(silverpoint, 'cream', opts('hatched', 'precision'));
    expect(svg).not.toContain('<pattern');
    expect(paths(svg)).toEqual([`<path d="M0 0H1280V720H0ZM32 32V688H1248V32Z" fill="none" stroke="${silverpoint.ink.secondary}" stroke-width="${BACKDROP_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>`]);
  });

  test('REQ-028 · REQ-587 · a weight ground draws the band as weight, not hatching', () => {
    const { svg } = slideBackdrop(cyanotype, 'prussian', opts('hatched'));
    expect(svg).not.toContain('<pattern');
    expect(svg).toContain(`fill="${cyanotype.substrates.prussian}"`);
    expect(svg).toContain(`stroke-width="${r2(BACKDROP_STROKE_WIDTH * (cyanotype.tonalRamp[1] as { weight: number }).weight)}"`);
  });

  test('REQ-587 · I-52 · byte-identical for the same inputs; the seed changes the hand', () => {
    expect(slideBackdrop(silverpoint, 'cream', opts('hatched'))).toEqual(slideBackdrop('silverpoint', 'cream', opts('hatched')));
    expect(slideBackdrop(silverpoint, 'cream', opts('plate', 'ink', 8)).svg).not.toBe(slideBackdrop(silverpoint, 'cream', opts('plate', 'ink', 7)).svg);
  });

  test('REQ-586 · a substrate the ground does not have is its first substrate', () => {
    expect(slideBackdrop(cyanotype, 'cream', opts('plain')).svg).toContain(`fill="${cyanotype.substrates.prussian}"`);
  });

  test('REQ-587 · 4:3: the shapes follow the size', () => {
    const { svg } = slideBackdrop(silverpoint, 'cream', { kind: 'plate', mode: 'precision', seed: 1, width: 960, height: 720 });
    expect(svg).toContain('viewBox="0 0 960 720"');
    expect(svg).toContain('d="M24 24H936V696H24Z"');
  });

  test('Art. 7 · the stroke width is the stylesheet’s --sp-stroke-width, for every ground', () => {
    const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8');
    const widths = [...css.matchAll(/--sp-stroke-width:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    expect(widths.length).toBeGreaterThan(0);
    for (const w of widths) expect(w).toBe(BACKDROP_STROKE_WIDTH);
  });
});
