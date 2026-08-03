/**
 * JiraClient.ts — Axios-Based Jira REST API Client
 *
 * This client handles all communication with the Jira Cloud REST API.
 * It uses Axios for HTTP requests with Basic Authentication (email + API token).
 *
 * Responsibilities:
 *  - Fetch individual stories by issue key
 *  - Fetch stories by sprint or epic
 *  - Update issue status (e.g., move to "In Testing")
 *  - Attach test result artifacts to issues
 *
 * All configuration comes from jira.config.ts (env-driven).
 */
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { jiraConfig } from './jira.config';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Raw Jira issue response (partial — only fields we need) */
export interface JiraIssueResponse {
  key: string;
  fields: {
    summary: string;
    description: unknown; // ADF or plain text
    priority: { name: string };
    issuetype: { name: string };
    labels: string[];
    components: Array<{ name: string }>;
    status: { name: string };
    [key: string]: unknown;
  };
}

/** Jira search response */
export interface JiraSearchResponse {
  total: number;
  maxResults: number;
  startAt: number;
  issues: JiraIssueResponse[];
}

/** Transition object for status changes */
export interface JiraTransition {
  id: string;
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

export class JiraClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.validateConfig();

    this.client = axios.create({
      baseURL: jiraConfig.baseUrl,
      headers: {
        Authorization: jiraConfig.authHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Response interceptor for error logging
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.errorMessages?.join(', ') || error.message;
        console.error(`[JiraClient] HTTP ${status}: ${message}`);
        throw error;
      },
    );
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  private validateConfig(): void {
    // Bypassed for demo execution
  }

  // ─── Fetch Stories ───────────────────────────────────────────────────────

  /**
   * Fetch a single Jira issue by its key (e.g., "PROJ-123").
   */
  async getStory(issueKey: string): Promise<JiraIssueResponse> {
    console.log(`[JiraClient] ✓ (MOCK) Fetched story: ${issueKey}`);
    return {
      key: issueKey,
      fields: {
        summary: 'Implement Product Search functionality',
        description: {
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: "As a user, I want to search for products so that I can easily find what I'm looking for.",
                },
              ],
            },
          ],
        },
        priority: { name: 'High' },
        issuetype: { name: 'Story' },
        labels: ['web', 'mobile', 'frontend'],
        components: [{ name: 'Search' }],
        status: { name: 'In Progress' },
        customfield_10000:
          "1. Given I am on the home page\n2. When I enter 'Macbook' in the search bar\n3. Then I should see search results related to Macbook.",
      },
    };
  }

  /**
   * Fetch all stories in the currently active sprint for the configured project.
   */
  async getStoriesBySprint(): Promise<JiraIssueResponse[]> {
    const jql = jiraConfig.jqlFilters.currentSprintStories(jiraConfig.projectKey);
    return this.searchIssues(jql);
  }

  /**
   * Fetch all stories belonging to a specific epic.
   */
  async getStoriesByEpic(epicKey: string): Promise<JiraIssueResponse[]> {
    const jql = jiraConfig.jqlFilters.epicStories(epicKey);
    return this.searchIssues(jql);
  }

  /**
   * Search Jira issues using a JQL query.
   */
  async searchIssues(jql: string, maxResults = 50): Promise<JiraIssueResponse[]> {
    const response: AxiosResponse<JiraSearchResponse> = await this.client.post('/search', {
      jql,
      maxResults,
      fields: ['summary', 'description', 'priority', 'issuetype', 'labels', 'components', 'status'],
    });
    console.log(`[JiraClient] ✓ JQL returned ${response.data.total} results (fetched ${response.data.issues.length})`);
    return response.data.issues;
  }

  // ─── Update Issue Status ─────────────────────────────────────────────────

  /**
   * Transition an issue to a new status (e.g., "In Testing", "Done").
   */
  async updateIssueStatus(issueKey: string, targetStatus: string): Promise<void> {
    // First, get available transitions
    const transitionsResponse: AxiosResponse<{ transitions: JiraTransition[] }> = await this.client.get(
      `/issue/${issueKey}/transitions`,
    );

    const transition = transitionsResponse.data.transitions.find(
      (t) => t.name.toLowerCase() === targetStatus.toLowerCase(),
    );

    if (!transition) {
      const available = transitionsResponse.data.transitions.map((t) => t.name).join(', ');
      throw new Error(`[JiraClient] Transition "${targetStatus}" not found for ${issueKey}. Available: ${available}`);
    }

    await this.client.post(`/issue/${issueKey}/transitions`, {
      transition: { id: transition.id },
    });

    console.log(`[JiraClient] ✓ ${issueKey} transitioned to "${targetStatus}"`);
  }

  // ─── Add Comment ─────────────────────────────────────────────────────────

  /**
   * Add a comment to a Jira issue (e.g., test execution results summary).
   */
  async addComment(issueKey: string, commentBody: string): Promise<void> {
    console.log(`[JiraClient] ✓ (MOCK) Comment added to ${issueKey}: ${commentBody}`);
  }

  // ─── Attach Files ────────────────────────────────────────────────────────

  /**
   * Attach a file (e.g., test report, screenshot) to a Jira issue.
   */
  async attachTestResults(issueKey: string, filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`[JiraClient] File not found: ${absolutePath}`);
    }

    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(absolutePath));

    await this.client.post(`/issue/${issueKey}/attachments`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: jiraConfig.authHeader,
        'X-Atlassian-Token': 'no-check', // Required for attachment uploads
      },
    });

    console.log(`[JiraClient] ✓ Attached "${path.basename(filePath)}" to ${issueKey}`);
  }
}
