/**
 * `handler` (API delta §1, REQ-538): the server over stateless Streamable HTTP, on Web `Request`
 * and `Response`, so any serverless runtime can call it. Each request gets a server and a
 * transport of its own and leaves nothing behind (REQ-562); the body limit holds before the body
 * is parsed (REQ-560); nothing is logged.
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createServer, type ServerOptions } from './server';
import { LIMITS } from './limits';

export const BODY_LIMIT = LIMITS.body;

/** A public, read-only endpoint with no credentials: any origin may call it. */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id',
  'access-control-expose-headers': 'mcp-session-id, mcp-protocol-version',
  'access-control-max-age': '86400',
} as const;

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(CORS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function rpcError(status: number, code: number, message: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), {
    status,
    headers: { 'content-type': 'application/json', ...CORS, ...extra },
  });
}

/** The body as text, read no further than the limit; `undefined` past it. */
async function boundedText(request: Request): Promise<string | undefined> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > BODY_LIMIT) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

const TOO_LARGE = `The request body exceeds ${BODY_LIMIT} bytes.`;

export async function handler(request: Request, options: ServerOptions = {}): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return rpcError(405, -32000, 'Method not allowed: this server is stateless, POST only.', { allow: 'POST, OPTIONS' });

  const length = Number(request.headers.get('content-length') ?? Number.NaN);
  if (length > BODY_LIMIT) return rpcError(413, -32000, TOO_LARGE);
  const text = await boundedText(request);
  if (text === undefined) return rpcError(413, -32000, TOO_LARGE);
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(text);
  } catch {
    return rpcError(400, -32700, 'Parse error: the body is not JSON.');
  }

  const server = createServer(options);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    // The body is consumed; the transport takes it parsed, with the request's headers.
    const forwarded = new Request(request.url, { method: 'POST', headers: request.headers });
    return withCors(await transport.handleRequest(forwarded, { parsedBody }));
  } finally {
    await server.close();
  }
}
