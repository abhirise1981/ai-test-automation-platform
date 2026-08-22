/**
 * generateBrdTool.ts — MCP Tool: Generate BRD
 */

import * as fs from 'fs';
import * as path from 'path';

const BRD_OUTPUT_DIR = path.resolve(__dirname, '../../agents/planner/brd-output');

export const generateBrdToolDefinition = {
  name: 'write_brd_to_disk',
  description:
    'Takes generated markdown content and physically writes it to the Cloud VM hard drive as a Business Requirements Document (BRD).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      issueKey: { type: 'string', description: 'The Jira issue key (e.g., PROJ-123)' },
      markdown: { type: 'string', description: 'The generated markdown content' },
    },
    required: ['issueKey', 'markdown'],
  },
};

export async function executeGenerateBrd(args: { issueKey: string; markdown: string }): Promise<{ brdPath: string }> {
  // 1. The Tool (Hands) receives the in-memory string and saves it to the file system
  if (!fs.existsSync(BRD_OUTPUT_DIR)) {
    fs.mkdirSync(BRD_OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `BRD-${args.issueKey}-${timestamp}.md`;
  const brdPath = path.join(BRD_OUTPUT_DIR, filename);

  fs.writeFileSync(brdPath, args.markdown, 'utf-8');
  console.log(`[generateBrdTool] 💾 Tool successfully saved file to disk: ${brdPath}`);

  return { brdPath };
}
