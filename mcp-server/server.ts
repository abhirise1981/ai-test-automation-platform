/**
 * server.ts — MCP Server (Model Context Protocol)
 *
 * Exposes AI Agent Tools via the Model Context Protocol.
 *
 * Usage: npm run mcp:start
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { executeGenerateBrd } from './tools/generateBrdTool';

// ─────────────────────────────────────────────────────────────────────────────
// Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'Playwright AI Test Automation Server',
  version: '1.0.0',
});

// ─────────────────────────────────────────────────────────────────────────────
// MCP Tools (The Hands)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Tool: Write BRD to Disk ───────────────────────────────────────────────

server.tool(
  'write_brd_to_disk',
  'Takes generated markdown content and physically writes it to the Cloud VM hard drive as a Business Requirements Document (BRD).',
  { 
    issueKey: z.string().describe('The Jira issue key (e.g., PROJ-123)'),
    markdown: z.string().describe('The generated markdown content to save')
  },
  async ({ issueKey, markdown }) => {
    try {
      const result = await executeGenerateBrd({ issueKey, markdown });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Server Initialization
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 MCP Server connected via stdio');
}

main().catch((error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});
