/**
 * jira.config.ts — Jira Connection Configuration
 *
 * Single source of truth for all Jira integration settings.
 * All values are read from environment variables (via .env) with sensible defaults.
 */
import 'dotenv/config';

export const jiraConfig = {
  /** Jira Cloud domain (e.g., https://your-domain.atlassian.net) */
  domain: process.env.JIRA_DOMAIN || 'https://your-domain.atlassian.net',

  /** Atlassian account email for Basic Auth */
  email: process.env.JIRA_EMAIL || '',

  /** Jira API token (generate at https://id.atlassian.com/manage-profile/security/api-tokens) */
  apiToken: process.env.JIRA_API_TOKEN || '',

  /** Default Jira project key */
  projectKey: process.env.JIRA_PROJECT_KEY || 'PROJ',

  /** REST API version */
  apiVersion: '3' as const,

  /** Default JQL filters for common queries */
  jqlFilters: {
    /** Stories ready for test automation in the current sprint */
    currentSprintStories: (projectKey: string) =>
      `project = "${projectKey}" AND issuetype = Story AND sprint in openSprints() AND status = "Ready for QA" ORDER BY priority DESC`,

    /** All stories in a specific epic */
    epicStories: (epicKey: string) => `"Epic Link" = "${epicKey}" AND issuetype = Story ORDER BY priority DESC`,

    /** A single issue by key */
    byKey: (issueKey: string) => `key = "${issueKey}"`,
  },

  /** Labels that indicate the story is for mobile platform */
  mobilePlatformLabels: ['mobile', 'android', 'ios', 'mobile-app', 'native-app'],

  /** Labels that indicate the story is for web platform */
  webPlatformLabels: ['web', 'desktop', 'browser', 'responsive'],

  /** Get the base URL for the Jira REST API */
  get baseUrl(): string {
    return `${this.domain}/rest/api/${this.apiVersion}`;
  },

  /** Get the Basic Auth header value */
  get authHeader(): string {
    return `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
  },
};
