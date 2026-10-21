# @silverpoint/mcp-vercel

The hosted silverpoint MCP server (DD-050, REQ-558): one Vercel function, `api/mcp.ts`, that hands
every request to `@silverpoint/mcp/http`. The official site rewrites its `/mcp` here, so it stays a
static export. Private; never published.

Vercel project settings: root directory `apps/mcp-vercel`, "Include files outside the root
directory" on, Node.js 22. The build compiles `@silverpoint/mcp` and the packages it imports.

After a deployment, run the smoke test (REQ-568) against it:

```sh
pnpm --filter @silverpoint/mcp-smoke smoke https://<deployment>/mcp
```
