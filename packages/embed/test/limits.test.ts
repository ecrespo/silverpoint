/** T-296 · limits (REQ-635) and the two new codes (SP030, SP031). */
import { describe, expect, test } from 'vitest';
import { renderToSVG, validateSpec } from '../src/index';
import { SPEC_BYTES } from '../src/spec/limits';

describe('limits', () => {
  test('REQ-635 · a spec over 2 MB serialised is refused with kind limit and SP030', () => {
    const row = { x: 'x'.repeat(100), value: 1 };
    const data = Array.from({ length: Math.ceil(SPEC_BYTES / 110) + 10 }, () => row);
    const result = validateSpec({ chart: 'bar-chart', data });
    expect(result).toMatchObject({ ok: false, error: { kind: 'limit' } });
    expect(result.diagnostics.map((d) => d.code)).toEqual(['SP030']);
    expect(result.diagnostics[0]!.severity).toBe('error');
  });

  test('REQ-635 · the limit is 2 MB', () => {
    expect(SPEC_BYTES).toBe(2 * 1024 * 1024);
  });

  test('SP030 and SP031 are the embed’s, of error severity, worded in the core’s format; the core ships no template of them', async () => {
    const { EMBED_ERRORS, errorDiagnostic } = await import('../src/spec/codes');
    expect(Object.keys(EMBED_ERRORS)).toEqual(['SP030', 'SP031']);
    expect(errorDiagnostic('SP031', 'BarChart', 'spec', 'x.').message).toMatch(/^\[SP031\] BarChart: .+ \(`spec`\)\. x\. .+\. \(REQ-668\)$/);
    const source = (await import('node:fs')).readFileSync(new URL('../../core/src/diagnostics/diagnose.ts', import.meta.url), 'utf8');
    expect(source.slice(source.indexOf('const ERRORS'))).not.toMatch(/SP03[01]: \{/);
  });
});
