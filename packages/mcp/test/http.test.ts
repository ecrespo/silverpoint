/**
 * `handler` (API delta §1, REQ-538, REQ-560, REQ-562, T-241): stateless Streamable HTTP over Web
 * `Request`/`Response`. Each request stands alone; the body limit holds before the body is parsed;
 * nothing is logged.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import core from '../../core/package.json' with { type: 'json' };
import { BODY_LIMIT, handler } from '../src/http';

const URL_ = 'https://example.test/mcp';
const HEADERS = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
let id = 0;

function post(method: string, params: unknown = {}, headers: Record<string, string> = {}): Request {
  id += 1;
  return new Request(URL_, { method: 'POST', headers: { ...HEADERS, ...headers }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
}

async function rpc(request: Request): Promise<{ status: number; body: { result?: Record<string, unknown>; error?: { code: number; message: string } } }> {
  const response = await handler(request);
  return { status: response.status, body: (await response.json()) as never };
}

const INITIALIZE = { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'http-test', version: '0' } };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('stateless Streamable HTTP (REQ-538)', () => {
  test('REQ-538 · initialize answers with the server and the catalog’s version, and no session id', async () => {
    const response = await handler(post('initialize', INITIALIZE));
    expect(response.status).toBe(200);
    expect(response.headers.get('mcp-session-id')).toBeNull();
    const body = (await response.json()) as { result: { serverInfo: { name: string; version: string } } };
    expect(body.result.serverInfo).toMatchObject({ name: 'silverpoint', version: core.version });
  });

  test('REQ-538 · REQ-562 · every request stands alone: tools and resources without a prior initialize', async () => {
    const tools = await rpc(post('tools/list'));
    expect(tools.status).toBe(200);
    expect((tools.body.result?.tools as unknown[]).length).toBe(11);
    const resources = await rpc(post('resources/list'));
    expect((resources.body.result?.resources as { uri: string }[]).map((r) => r.uri)).toContain('silverpoint://catalog');
  });

  test('REQ-538 · the same tools as stdio: render_chart over HTTP', async () => {
    const { body } = await rpc(post('tools/call', { name: 'render_chart', arguments: { chart: 'line-chart', width: 320 } }));
    expect((body.result?.structuredContent as { svg: string }).svg).toMatch(/^<svg/);
  });

  test('REQ-538 · GET and DELETE have no meaning without sessions: 405; OPTIONS answers CORS', async () => {
    for (const method of ['GET', 'DELETE']) {
      const response = await handler(new Request(URL_, { method }));
      expect(response.status, method).toBe(405);
      expect(response.headers.get('allow')).toBe('POST, OPTIONS');
    }
    const preflight = await handler(new Request(URL_, { method: 'OPTIONS' }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*');
    expect(preflight.headers.get('access-control-allow-headers')).toMatch(/mcp-protocol-version/i);
    const answered = await handler(post('tools/list'));
    expect(answered.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('REQ-538 · a body that is not JSON is a JSON-RPC parse error', async () => {
    const response = await handler(new Request(URL_, { method: 'POST', headers: HEADERS, body: '{"jsonrpc":' }));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: { code: number } }).error.code).toBe(-32700);
  });
});

describe('limits and logging (REQ-560, REQ-562)', () => {
  test('REQ-560 · a body over 256 KB is refused with 413 from its Content-Length, before it is read', async () => {
    const request = new Request(URL_, { method: 'POST', headers: { ...HEADERS, 'content-length': String(BODY_LIMIT + 1) }, body: 'x' });
    const json = vi.spyOn(request, 'json');
    const text = vi.spyOn(request, 'text');
    const response = await handler(request);
    expect(response.status).toBe(413);
    expect(json).not.toHaveBeenCalled();
    expect(text).not.toHaveBeenCalled();
  });

  test('REQ-560 · a body over 256 KB without a length is cut off while streaming, never buffered whole', async () => {
    const chunk = new Uint8Array(64 * 1024).fill(32);
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        if (pulled > 100) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const response = await handler(new Request(URL_, { method: 'POST', headers: HEADERS, body, duplex: 'half' } as RequestInit));
    expect(response.status).toBe(413);
    expect(pulled).toBeLessThan(10);
  });

  test('REQ-562 · each request’s server is closed once it has answered, an error answer included', async () => {
    const close = vi.spyOn(McpServer.prototype, 'close');
    await handler(post('tools/list'));
    await handler(post('tools/call', { name: 'get_chart', arguments: { slug: 'sankie' } }));
    expect(close).toHaveBeenCalledTimes(2);
  });

  test('REQ-562 · nothing is logged: not the body, not the result', async () => {
    const calls = (['log', 'info', 'warn', 'error', 'debug'] as const).map((name) => vi.spyOn(console, name).mockImplementation(() => undefined));
    await handler(post('tools/call', { name: 'validate_props', arguments: { chart: 'line-chart', props: { data: [] } } }));
    await handler(post('tools/call', { name: 'get_chart', arguments: { slug: 'sankie' } }));
    for (const call of calls) expect(call).not.toHaveBeenCalled();
  });
});
