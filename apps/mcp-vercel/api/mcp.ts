/**
 * The hosted MCP endpoint (DD-050, REQ-558): Vercel's Node runtime calls each method with a Web
 * `Request`. The handler is stateless, so GET and DELETE answer 405 and OPTIONS the CORS preflight.
 */
import { handler } from '@silverpoint/mcp/http';

const answer = (request: Request): Promise<Response> => handler(request);

export { answer as POST, answer as GET, answer as DELETE, answer as OPTIONS };
