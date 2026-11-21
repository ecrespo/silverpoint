/** T-296 · rendered path data over the budget (REQ-635): `pathBytes` forced past the budget. */
import { describe, expect, test, vi } from 'vitest';

vi.mock('@silverpoint/core', async (original) => ({ ...(await original<typeof import('@silverpoint/core')>()), pathBytes: () => 10 * 1024 * 1024 }));

describe('path byte budget', () => {
  test('REQ-635 · a render whose path data exceeds the budget is refused with kind limit and SP030', async () => {
    const { renderToSVG } = await import('../src/index');
    const result = renderToSVG({ chart: 'bar-chart' });
    expect(result).toMatchObject({ ok: false, error: { kind: 'limit' } });
    expect(result.diagnostics.at(-1)).toMatchObject({ code: 'SP030', severity: 'error' });
  });
});
