import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';

/**
 * The Angular CLI SSR server (REQ-222): the browser build's files as they are, every other URL
 * rendered by the app on the request. Plain `node:http`, so the example needs no Express.
 */
const browser = fileURLToPath(new URL('../browser/', import.meta.url));
// The bench and the pixel gate reach it on localhost only; any other host falls back (SSRF guard).
const engine = new AngularNodeAppEngine({ allowedHosts: ['localhost', '127.0.0.1'] });
const TYPES: Readonly<Record<string, string>> = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

function staticFile(url: string | undefined): string | undefined {
  const path = normalize(decodeURIComponent(new URL(url ?? '/', 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = join(browser, path);
  return path !== '' && file.startsWith(browser) && existsSync(file) && statSync(file).isFile() && extname(file) !== '.html' ? file : undefined;
}

const handler = (request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse) => {
  const file = staticFile(request.url);
  if (file) {
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
    return;
  }
  engine
    .handle(request)
    .then((rendered) => {
      if (rendered) return writeResponseToNodeResponse(rendered, response);
      response.writeHead(404).end();
      return undefined;
    })
    .catch((error: unknown) => {
      console.error(error);
      response.writeHead(500).end();
    });
};

if (isMainModule(import.meta.url)) {
  const flag = process.argv.indexOf('--port');
  const port = flag === -1 ? Number(process.env['PORT'] ?? 4200) : Number(process.argv[flag + 1]);
  createServer(handler).listen(port, () => console.log(`serving on http://localhost:${port}/`));
}

/** The handler the Angular CLI dev server and other hosts use. */
export const reqHandler = createNodeRequestHandler(handler);
