/**
 * REQ-559 · the built server (`packages/mcp/dist/bin.js`, as `npx @silverpoint/mcp` runs it) answers
 * `initialize` within 1.5 s of a cold start, and `render_chart` of each chart's demo dataset within
 * 300 ms at p95. Over stdio, JSON-RPC written by hand: the measurement includes the transport.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import catalog from '../../packages/mcp/agent-catalog.json' with { type: 'json' };

const BIN = join(dirname(fileURLToPath(import.meta.url)), '../../packages/mcp/dist/bin.js');

let server: ChildProcessWithoutNullStreams;
const pending = new Map<number, (message: { result?: unknown; error?: unknown }) => void>();
let next = 1;
let coldStart = Number.POSITIVE_INFINITY;

function request(method: string, params: unknown): Promise<{ result?: unknown; error?: unknown }> {
  const id = next++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  });
}

beforeAll(async () => {
  expect(existsSync(BIN), 'run `pnpm build` first').toBe(true);
  const started = performance.now();
  server = spawn(process.execPath, [BIN], { stdio: 'pipe' });
  createInterface({ input: server.stdout }).on('line', (line) => {
    const message = JSON.parse(line) as { id?: number; result?: unknown; error?: unknown };
    if (message.id !== undefined) pending.get(message.id)?.(message);
  });
  await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'latency', version: '0' } });
  coldStart = performance.now() - started;
  server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
});

afterAll(() => {
  server?.kill();
});

describe('latency (REQ-559)', () => {
  test('REQ-559 · a cold start answers initialize within 1.5 s', () => {
    expect(coldStart).toBeLessThan(1500);
  });

  test('REQ-559 · render_chart of a demo dataset within 300 ms at p95, over every chart', async () => {
    const times: number[] = [];
    for (const { slug } of catalog.charts) {
      const started = performance.now();
      const reply = (await request('tools/call', { name: 'render_chart', arguments: { chart: slug } })) as { result?: { isError?: boolean } };
      times.push(performance.now() - started);
      expect(reply.result?.isError, slug).toBeFalsy();
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.ceil(times.length * 0.95) - 1]!;
    expect(p95).toBeLessThan(300);
  });
});
