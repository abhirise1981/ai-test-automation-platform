/**
 * fetchStoryTool.ts — MCP Tool: Fetch Jira Story
 */
import { JiraClient } from '../../agents/jira/JiraClient';
import { type ParsedStory, StoryParser } from '../../agents/jira/StoryParser';

export const fetchStoryToolDefinition = {
  name: 'fetch_jira_story',
  description:
    'Fetches a Jira user story by its issue key and parses it into a structured format with acceptance criteria, priority, platform detection, and metadata.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      issueKey: { type: 'string', description: 'Jira issue key (e.g., "PROJ-123")' },
    },
    required: ['issueKey'],
  },
};

export async function executeFetchStory(args: { issueKey: string }): Promise<ParsedStory> {
  const client = new JiraClient();
  const parser = new StoryParser();
  const rawIssue = await client.getStory(args.issueKey);
  return parser.parse(rawIssue);
}
