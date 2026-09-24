import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  __setDiagnosticSink,
  checkTypeface,
  diagnose,
  SilverpointError,
  type SpCode,
} from '../src';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

describe('diagnose', () => {
  test('REQ-007 · warnings follow the single template naming chart, property and requirement', () => {
    const seen = capture();
    diagnose('SP001', 'LineChart', { property: 'data' });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.message).toMatch(/^\[SP001\] LineChart: .+\(`data`\)\..+\. \(REQ-007\)$/);
  });

  test('REQ-009 · repeated identical warnings are reported once', () => {
    const seen = capture();
    diagnose('SP003', 'LineChart', { property: 'width' });
    diagnose('SP003', 'LineChart', { property: 'width' });
    expect(seen).toHaveLength(1);
  });

  test('REQ-097 · SP009 throws in every build', () => {
    expect(() => diagnose('SP009', 'CandlestickChart', { property: 'bounds' })).toThrow(SilverpointError);
    expect(() => diagnose('SP009', 'CandlestickChart', { property: 'bounds' })).toThrow(/`bounds`.*REQ-097/);
  });

  test('REQ-008 · warnings are silent in production', () => {
    const seen = capture();
    vi.stubEnv('NODE_ENV', 'production');
    try {
      diagnose('SP002', 'LineChart', { property: 'hits' });
    } finally {
      vi.unstubAllEnvs();
    }
    expect(seen).toHaveLength(0);
  });

  test('REQ-007 · a production build contains no SP0 code except those of error severity', async () => {
    const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      write: false,
      format: 'esm',
      platform: 'neutral',
      mainFields: ['module', 'main'],
      define: { 'process.env.NODE_ENV': '"production"' },
      logLevel: 'silent',
    });
    const code = result.outputFiles[0]?.text ?? '';
    const codes = new Set(code.match(/SP0\d\d/g) ?? []);
    expect([...codes].sort()).toEqual(['SP009', 'SP012']);
  });
});

describe('typeface check', () => {
  test('REQ-032 · a failed font load reports SP013 and does not throw', async () => {
    const seen = capture();
    const fonts = {
      load: () => Promise.reject(new Error('blocked')),
      check: () => false,
    };
    await expect(checkTypeface(fonts, 'LineChart')).resolves.toBe(false);
    expect(seen.map((d) => d.code)).toEqual(['SP013']);
  });

  test('REQ-032 · a loaded face reports nothing', async () => {
    const seen = capture();
    const fonts = { load: () => Promise.resolve([{}]), check: () => true };
    await expect(checkTypeface(fonts, 'LineChart')).resolves.toBe(true);
    expect(seen).toHaveLength(0);
  });
});
