import { UI_FRAME_KINDS, uiFrameOutline } from '@silverpoint/core/ui';
import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../src';
import { svgDataUri, uiFramePieces, uiTonePieces } from '../src/ui/pieces';

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1];
const pathOf = (svg: string) => /<path d="([^"]+)"/.exec(svg)?.[1];

describe('frame pieces (T-140)', () => {
  test('REQ-305 · a sliced kind is cut into four corners and four edges, each a window on one inked outline', () => {
    const pieces = uiFramePieces(silverpoint, 'control', 0);
    expect(pieces).not.toBeNull();
    expect(Object.keys(pieces!.pieces)).toEqual(['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l']);
    const { size, slice } = UI_FRAME_KINDS.control;
    const mid = size - 2 * slice;
    expect(Object.fromEntries(Object.entries(pieces!.pieces).map(([k, svg]) => [k, viewBox(svg)]))).toEqual({
      tl: `0 0 ${slice} ${slice}`,
      t: `${slice} 0 ${mid} ${slice}`,
      tr: `${size - slice} 0 ${slice} ${slice}`,
      r: `${size - slice} ${slice} ${slice} ${mid}`,
      br: `${size - slice} ${size - slice} ${slice} ${slice}`,
      b: `${slice} ${size - slice} ${mid} ${slice}`,
      bl: `0 ${size - slice} ${slice} ${slice}`,
      l: `0 ${slice} ${slice} ${mid}`,
    });
    expect(new Set(Object.values(pieces!.pieces).map(pathOf)).size).toBe(1);
  });

  test('REQ-305 · the outline is drawn by the ground\'s inker, not the exact one, and every variant differently', () => {
    const exact = uiFrameOutline('control').strokes[0]!.d;
    const drawn = [0, 1, 2, 3].map((v) => pathOf(uiFramePieces(silverpoint, 'control', v)!.pieces.tl));
    expect(drawn.every((d) => d !== exact)).toBe(true);
    expect(new Set(drawn).size).toBe(4);
  });

  test('REQ-307 · Art. 4 · the same ground, kind and variant give the same bytes on every run', () => {
    expect(uiFramePieces(silverpoint, 'card', 2)).toEqual(uiFramePieces(silverpoint, 'card', 2));
    expect(uiTonePieces(silverpoint, 4)).toEqual(uiTonePieces(silverpoint, 4));
  });

  test('REQ-305 · box and round frame fixed-size squares: one whole piece each', () => {
    for (const kind of ['box', 'round'] as const) {
      const pieces = uiFramePieces(silverpoint, kind, 1)!;
      expect(Object.keys(pieces.pieces)).toEqual(['all']);
      expect(viewBox(pieces.pieces.all!)).toBe(`0 0 ${UI_FRAME_KINDS[kind].size} ${UI_FRAME_KINDS[kind].size}`);
    }
  });

  test('REQ-305 · a ground whose frame is `css` generates no piece (cyanotype)', () => {
    expect(uiFramePieces(cyanotype, 'control', 0)).toBeNull();
    expect(uiTonePieces(cyanotype, 3)).toEqual([]);
  });
});

describe('tone pieces (T-140)', () => {
  test('REQ-308 · each ramp step of a hatch ground is one tile layer, two for cross-hatch, drawn by hand', () => {
    expect(uiTonePieces(silverpoint, 1)).toHaveLength(1);
    expect(uiTonePieces(silverpoint, 4)).toHaveLength(2);
    const [layer] = uiTonePieces(silverpoint, 3);
    expect(viewBox(layer!.svg)).toBe(`0 0 ${layer!.width} ${layer!.height}`);
    expect(layer!.svg.match(/<path /g)!.length).toBeGreaterThan(4);
  });
});

describe('svgDataUri (T-140)', () => {
  test('REQ-305 · REQ-042 · a piece is a mask: alpha only, no colour of the ground, URL-safe', () => {
    const svg = uiFramePieces(silverpoint, 'pill', 0)!.pieces.t!;
    expect(svg).toMatch(/stroke="black"/);
    expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    const uri = svgDataUri(svg);
    expect(uri.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(uri.slice(5, -2)).not.toMatch(/[#<>"%](?![0-9A-F]{2})/);
    expect(decodeURIComponent(uri.slice(5 + 'data:image/svg+xml,'.length, -2)).replaceAll("'", '"')).toBe(svg);
  });
});
