/**
 * The deployed function (`apps/mcp-vercel/api/mcp.ts`, over the built `@silverpoint/mcp/http`)
 * behind a plain Node HTTP server, each request handed to the export named by its method as Vercel
 * does: for the smoke test in CI, and locally (`pnpm --filter @silverpoint/mcp-smoke serve
 * [port]`, then `http://127.0.0.1:<port>/mcp`).
 */
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import * as route from '../../apps/mcp-vercel/api/mcp';

const METHODS: Readonly<Record<string, (request: Request) => Promise<Response>>> = route;

export function serve(port = 0): Promise<{ url: string; server: Server }> {
  const server = createServer(async (req, res) => {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value);
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers,
      ...(hasBody ? { body: Readable.toWeb(req) as ReadableStream, duplex: 'half' } : {}),
    } as RequestInit);
    const method = METHODS[req.method ?? ''];
    const response = method ? await method(request) : new Response(null, { status: 405 });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`, server }));
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { url } = await serve(Number(process.argv[2] ?? 3333));
  console.log(`silverpoint MCP at ${url}`);
}
