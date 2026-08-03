/**
 * generateBrdTool.ts — MCP Tool: Generate BRD
 */
import { PlannerAgent } from '../../agents/planner/PlannerAgent';
import type { ParsedStory } from '../../agents/jira/StoryParser';

export const generateBrdToolDefinition = {
  name: 'generate_brd',
  description:
    'Takes a parsed Jira story and generates a Business Requirements Document (BRD) as a markdown file using AI analysis.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      story: { type: 'object', description: 'ParsedStory JSON object from fetch_jira_story' },
    },
    required: ['story'],
  },
};

export async function executeGenerateBrd(args: { story: ParsedStory }): Promise<{ brdPath: string }> {
  const planner = new PlannerAgent();
  const brdPath = await planner.generateBrd(args.story);
  return { brdPath };
}
