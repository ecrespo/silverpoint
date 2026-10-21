/**
 * REQ-568 · CI starts the built HTTP handler (the Vercel function over `@silverpoint/mcp/http`
 * from `dist/`, behind a Node HTTP server as the platform calls it) and runs the MCP smoke test.
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { serve } from './serve';
import { CALLS, smoke } from './smoke';

let server: Server;
let url: string;

beforeAll(async () => {
  ({ server, url } = await serve());
});

afterAll(() => {
  server?.close();
});

describe('MCP smoke test over HTTP (REQ-568)', () => {
  test('REQ-568 · REQ-538 · initialise, list tools, resources and prompts, call every tool once', async () => {
    const report = await smoke(url);
    expect(report.problems).toEqual([]);
    expect([...report.tools].sort()).toEqual(Object.keys(CALLS).sort());
    expect(report.resources).toBeGreaterThan(90);
    expect(report.templates).toBe(3);
    expect([...report.prompts].sort()).toEqual(['build-dashboard', 'choose-chart']);
  });

  test('REQ-558 · the function answers every method Vercel may route to it', async () => {
    const preflight = await fetch(url, { method: 'OPTIONS' });
    expect(preflight.status).toBe(204);
    for (const method of ['GET', 'DELETE']) expect((await fetch(url, { method })).status, method).toBe(405);
  });

  test('REQ-568 · the smoke test fails when a tool answers with an error', async () => {
    const broken = await serve();
    const original = CALLS.get_chart;
    (CALLS as Record<string, unknown>).get_chart = { slug: 'sankie' };
    try {
      expect((await smoke(broken.url)).problems.some((p) => p.startsWith('get_chart:'))).toBe(true);
    } finally {
      (CALLS as Record<string, unknown>).get_chart = original;
      broken.server.close();
    }
  });
});
