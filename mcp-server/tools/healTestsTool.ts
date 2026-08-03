/**
 * healTestsTool.ts — MCP Tool: Heal Failed Tests
 */
import { HealerAgent } from '../../agents/healer/HealerAgent';

export const healTestsToolDefinition = {
  name: 'heal_tests',
  description:
    'Analyzes Playwright test results, classifies failures, auto-fixes locator and timing issues, and generates a healing report.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      resultsPath: { type: 'string', description: 'Path to the Playwright JSON results file' },
    },
    required: ['resultsPath'],
  },
};

export async function executeHealTests(args: { resultsPath: string }) {
  const healer = new HealerAgent();
  return healer.healFromResults(args.resultsPath);
}
