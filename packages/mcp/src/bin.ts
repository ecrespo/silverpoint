#!/usr/bin/env node
/**
 * `npx @silverpoint/mcp` (API delta §1, REQ-538): the server over stdio. Nothing but the protocol
 * goes to stdout.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';

await createServer().connect(new StdioServerTransport());
