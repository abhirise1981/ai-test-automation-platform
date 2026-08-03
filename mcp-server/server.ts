/**
 * server.ts — MCP Server (Model Context Protocol)
 *
 * Exposes all AI agents as MCP tools that any MCP-compatible client
 * (Claude Desktop, Cursor, VS Code, this IDE) can invoke to orchestrate
 * the entire test automation pipeline.
 *
 * Transport: Stdio (for local IDE integration)
 *
 * Usage: npm run mcp:start
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { executeFetchStory } from './tools/fetchStoryTool';
import { executeGenerateBrd } from './tools/generateBrdTool';
import { executeGenerateTests } from './tools/generateTestsTool';
import { executeRunTests } from './tools/runTestsTool';
import { executeRunMobileTests } from './tools/runMobileTestsTool';
import { executeHealTests } from './tools/healTestsTool';

// ─────────────────────────────────────────────────────────────────────────────
// Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'toptal-test-automation',
  version: '1.0.0',
});

// ─── Tool: Fetch Jira Story ────────────────────────────────────────────────

server.tool(
  'fetch_jira_story',
  'Fetches a Jira user story by issue key and parses acceptance criteria, priority, and platform.',
  { issueKey: z.string().describe('Jira issue key (e.g., "PROJ-123")') },
  async ({ issueKey }) => {
    try {
      const story = await executeFetchStory({ issueKey });
      return { content: [{ type: 'text' as const, text: JSON.stringify(story, null, 2) }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  },
);

// ─── Tool: Generate BRD ───────────────────────────────────────────────────

server.tool(
  'generate_brd',
  'Generates a Business Requirements Document (BRD) from a parsed Jira story using AI.',
  { story: z.string().describe('ParsedStory JSON string from fetch_jira_story') },
  async ({ story }) => {
    try {
      const parsedStory = JSON.parse(story);
      const result = await executeGenerateBrd({ story: parsedStory });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  },
);

// ─── Tool: Generate Tests ──────────────────────────────────────────────────

server.tool(
  'generate_tests',
  'Generates Playwright/Appium test scripts from a BRD markdown file.',
  {
    brdPath: z.string().describe('Path to the BRD markdown file'),
    writeFiles: z.boolean().optional().describe('Write generated files to disk (default: true)'),
  },
  async ({ brdPath, writeFiles }) => {
    try {
      const result = await executeGenerateTests({ brdPath, writeFiles });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  },
);

// ─── Tool: Run Web Tests ───────────────────────────────────────────────────

server.tool(
  'run_tests',
  'Executes Playwright web tests on local, BrowserStack, or mobile-web emulation.',
  {
    target: z.enum(['local', 'browserstack', 'mobile-web']).optional().describe('Execution target'),
    headed: z.boolean().optional().describe('Run in headed mode'),
  },
  async ({ target, headed }) => {
    try {
      const result = await executeRunTests({ target, headed });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  },
);

// ─── Tool: Run Mobile Tests ───────────────────────────────────────────────

server.tool(
  'run_mobile_tests',
  'Executes native mobile tests via Appium on local emulator or cloud devices.',
  {
    suite: z.enum(['android', 'ios', 'all']).optional().describe('Platform suite'),
    target: z.enum(['local', 'browserstack', 'aws']).optional().describe('Execution target'),
  },
  async ({ suite, target }) => {
    try {
      const result = await executeRunMobileTests({ suite, target });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  },
);

// ─── Tool: Heal Tests ──────────────────────────────────────────────────────

server.tool(
  'heal_tests',
  'Analyzes test failures, auto-fixes locators/timing, and generates a healing report.',
  { resultsPath: z.string().describe('Path to Playwright JSON results file') },
  async ({ resultsPath }) => {
    try {
      const result = await executeHealTests({ resultsPath });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  },
);

// ─── Tool: Full Pipeline ───────────────────────────────────────────────────

server.tool(
  'full_pipeline',
  'Runs the complete pipeline: Jira → BRD → Generate Tests → Execute → Heal failures.',
  {
    issueKey: z.string().describe('Jira issue key to process'),
    target: z.enum(['local', 'browserstack', 'mobile-web']).optional().describe('Execution target'),
  },
  async ({ issueKey, target }) => {
    try {
      const steps: string[] = [];

      // Step 1: Fetch story
      steps.push(`Step 1: Fetching story ${issueKey}...`);
      const story = await executeFetchStory({ issueKey });
      steps.push(`  ✅ Story fetched: "${story.summary}" (${story.platform})`);

      // Step 2: Generate BRD
      steps.push(`Step 2: Generating BRD...`);
      const { brdPath } = await executeGenerateBrd({ story });
      steps.push(`  ✅ BRD generated: ${brdPath}`);

      // Step 3: Generate tests
      steps.push(`Step 3: Generating test scripts...`);
      const { files, summary } = await executeGenerateTests({ brdPath });
      steps.push(`  ✅ ${summary}`);

      // Step 4: Run tests
      steps.push(`Step 4: Running tests (target: ${target || 'local'})...`);
      const testResult = await executeRunTests({ target });
      steps.push(`  ${testResult.exitCode === 0 ? '✅' : '❌'} Exit code: ${testResult.exitCode}`);

      // Step 5: Heal if failures
      if (testResult.exitCode !== 0) {
        steps.push(`Step 5: Healing failures...`);
        const healResult = await executeHealTests({ resultsPath: 'test-results/results.json' });
        steps.push(`  🩹 Healed: ${healResult.healed}, Needs review: ${healResult.needsHumanReview}`);
      }

      return { content: [{ type: 'text' as const, text: steps.join('\n') }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text' as const, text: `Pipeline error: ${message}` }], isError: true };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP Server] ✅ Toptal Test Automation MCP Server running on stdio');
}

main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error);
  process.exit(1);
});
