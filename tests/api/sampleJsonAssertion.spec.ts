import { test, expect } from '@playwright/test';

test.describe('Interview Prep: Nested JSON Parsing & Assertions', () => {
  test('should validate nested object, arrays, and properties', async () => {
    // 1. Sample Nested JSON payload (same as API response.json())
    const responsePayload = {
      status: 'success',
      data: {
        user: {
          id: 1054,
          profile: {
            name: 'Abhishek Kumar',
            role: 'QA Architect',
          },
          roles: ['ADMIN', 'TESTER'],
          projects: [
            { projectId: 'PRJ-101', name: 'AI Platform', active: true },
            { projectId: 'PRJ-102', name: 'Cloud Mobile', active: false },
          ],
        },
      },
    };

    // 2. Root key assertion
    expect(responsePayload.status).toBe('success');

    // 3. Nested object key assertion
    expect(responsePayload.data.user.id).toBe(1054);
    expect(responsePayload.data.user.profile.name).toBe('Abhishek Kumar');

    // 4. Array item by index [0]
    expect(responsePayload.data.user.roles[0]).toBe('ADMIN');

    // 5. Array contains value (anywhere in array)
    expect(responsePayload.data.user.roles).toContain('TESTER');

    // 6. Array of nested objects
    expect(responsePayload.data.user.projects[0].projectId).toBe('PRJ-101');
    expect(responsePayload.data.user.projects[0].active).toBe(true);

    // 7. Array length
    expect(responsePayload.data.user.projects).toHaveLength(2);

    // 8. Safe existence checks (toHaveProperty & defined)
    expect(responsePayload.data.user).toHaveProperty('roles');
    expect(responsePayload.data?.user?.profile?.role).toBeDefined();
  });
});
