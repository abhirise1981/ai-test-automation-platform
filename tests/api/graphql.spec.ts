import { expect, test } from '@playwright/test';

/**
 * graphql.spec.ts — GraphQL API Automation via Playwright & TypeScript
 *
 * Demonstrates native GraphQL Query & Mutation testing using Playwright's
 * APIRequestContext without external dependencies.
 */

// Strongly-typed response interfaces
interface GraphQLQueryResponse {
  data: {
    country: {
      code: string;
      name: string;
      capital: string;
      currency: string;
    };
  };
  errors?: Array<{ message: string }>;
}

test.describe('GraphQL API Automation Suite — Playwright & TypeScript', () => {
  const GRAPHQL_ENDPOINT = 'https://countries.trevorblades.com/graphql';

  test('GRAPHQL-01: Fetch Country Details by Code via GraphQL Query', async ({ request }) => {
    const query = `
      query GetCountry($code: ID!) {
        country(code: $code) {
          code
          name
          capital
          currency
        }
      }
    `;

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables: { code: 'US' },
      },
    });

    expect(response.status()).toBe(200);

    const body: GraphQLQueryResponse = await response.json();

    // Assert no GraphQL execution errors
    expect(body.errors).toBeUndefined();

    // Validate GraphQL schema fields
    expect(body.data.country.name).toBe('United States');
    expect(body.data.country.capital).toBe('Washington D.C.');
    expect(body.data.country.currency).toContain('USD');
  });

  test('GRAPHQL-02: Validate GraphQL Schema Error handling for invalid parameters', async ({ request }) => {
    const query = `
      query GetInvalidCountry($code: ID!) {
        country(code: $code) {
          nonExistentField
        }
      }
    `;

    const response = await request.post(GRAPHQL_ENDPOINT, {
      data: {
        query,
        variables: { code: 'INVALID' },
      },
    });

    // GraphQL syntax errors return HTTP 400 or HTTP 200 with an errors array
    const body = await response.json();
    expect(body.errors).toBeDefined();
    expect(body.errors.length).toBeGreaterThan(0);
  });
});
