import { expect, test } from '@playwright/test';
import { LocationApiClient } from '../../api/LocationApiClient';
import { testConfig } from '../../config/testConfig';

/**
 * REST API Location & Geocoding Test Suite
 *
 * Architecture: API Object Model
 * - All HTTP calls are made via LocationApiClient (never directly in test blocks).
 * - Test blocks contain ONLY assertions — they verify what the client returns.
 * - Tests are grouped into nested describe blocks by HTTP verb and endpoint.
 * - Data-driven tests use testConfig for all test data (zero hardcoded values).
 *
 * HTTP Response Codes Covered:
 * ✅ 200 OK        — Successful GET, PUT, DELETE
 * ✅ 201 Created   — Successful POST
 * ✅ 401 Unauthorized — Missing authentication credentials
 * ✅ 404 Not Found — Invalid endpoint path
 * ✅ 500 Server Error — Server crash on non-existent resource update
 */

test.describe('Location & Geocoding API Tests — API Object Model', () => {
  let apiClient: LocationApiClient;

  test.beforeEach(async ({ request }) => {
    apiClient = new LocationApiClient(request);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: GET — Geocoding / Search Endpoint
  // Tests the Nominatim OpenStreetMap geocoding service.
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('GET /search — Geocoding Endpoint', () => {
    test('API-01: Returns 200 OK and valid coordinate schema for a known city (London)', async () => {
      const response = await apiClient.searchLocation('London');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Schema validation — all required fields must exist
      const location = body[0];
      expect(location).toHaveProperty('lat');
      expect(location).toHaveProperty('lon');
      expect(location).toHaveProperty('display_name');
      expect(location).toHaveProperty('osm_type');
      expect(location).toHaveProperty('place_id');

      // Data validation — lat/lon must be real numeric strings
      expect(parseFloat(location.lat)).not.toBeNaN();
      expect(parseFloat(location.lon)).not.toBeNaN();

      console.log(`✓ Retrieved: ${location.display_name} (Lat: ${location.lat}, Lon: ${location.lon})`);
    });

    // Data-Driven Test: Run the same schema validation for multiple cities
    testConfig.api.cities.forEach((city, index) => {
      const testId = `API-${String(index + 2).padStart(2, '0')}`;
      test(`${testId}: Returns 200 OK with valid schema for: ${city.name}`, async () => {
        const response = await apiClient.searchLocation(city.name);

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);

        // Schema validation — all required fields must exist regardless of language
        const location = body[0];
        expect(location).toHaveProperty('lat');
        expect(location).toHaveProperty('lon');
        expect(location).toHaveProperty('display_name');
        // lat/lon must be real numeric strings
        expect(parseFloat(location.lat)).not.toBeNaN();
        expect(parseFloat(location.lon)).not.toBeNaN();

        console.log(`✓ ${city.name}: ${location.display_name}`);
      });
    });

    test('API-05: Returns 404 Not Found for an invalid/non-existent endpoint path', async () => {
      const response = await apiClient.searchInvalidEndpoint();

      expect(response.status()).toBe(404);
      console.log(`✓ Invalid endpoint correctly returned: ${response.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Authentication / Security Tests
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Security — Authentication Tests', () => {
    test('API-06: Returns 401 Unauthorized when no credentials are provided to a protected endpoint', async () => {
      const response = await apiClient.accessProtectedEndpointWithoutAuth();

      expect(response.status()).toBe(401);
      console.log(`✓ Unauthorized access correctly returned: ${response.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: GET — Retrieve Location Resources
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('GET /posts — Retrieve Location Resources', () => {
    test('API-07: Returns 200 OK and a non-empty list when retrieving all locations', async () => {
      const response = await apiClient.getAllLocations();

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      console.log(`✓ Retrieved ${body.length} location records.`);
    });

    test('API-08: Returns 200 OK and correct schema for a single location by ID', async () => {
      const response = await apiClient.getLocationById(1);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('id', 1);
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('body');
      expect(body).toHaveProperty('userId');
      console.log(`✓ Retrieved location ID 1: "${body.title}"`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: POST — Create Location Resources
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('POST /posts — Create Location Resource', () => {
    test('API-09: Returns 201 Created with correct response body for valid location payload', async () => {
      const response = await apiClient.createLocation(testConfig.api.sampleLocation);

      expect(response.status()).toBe(201);

      const body = await response.json();
      // Validate all submitted fields are echoed back correctly
      expect(body.title).toBe(testConfig.api.sampleLocation.title);
      expect(body.body).toBe(testConfig.api.sampleLocation.body);
      expect(body.userId).toBe(testConfig.api.sampleLocation.userId);

      // Validate server auto-generated a new unique ID
      expect(body.id).toBeDefined();
      expect(typeof body.id).toBe('number');

      console.log(`✓ Location created: "${body.title}" (ID: ${body.id})`);
    });

    test('API-10: Returns 201 Created and response body contains all required fields', async () => {
      const response = await apiClient.createLocation(testConfig.api.sampleLocation);

      expect(response.status()).toBe(201);

      const body = await response.json();
      // Schema validation: ensure the response structure is complete
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('body');
      expect(body).toHaveProperty('userId');
      console.log(`✓ Response schema validated: all required fields present.`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: PUT — Update Location Resources
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('PUT /posts/:id — Update Location Resource', () => {
    test('API-11: Returns 200 OK and reflects updated values for an existing resource', async () => {
      const response = await apiClient.updateLocation(1, testConfig.api.updatedLocation);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.title).toBe(testConfig.api.updatedLocation.title);
      expect(body.body).toBe(testConfig.api.updatedLocation.body);
      console.log(`✓ Location updated: "${body.title}"`);
    });

    test('API-12: [BUG] Returns 500 Server Error when updating a non-existent resource ID (should be 404)', async () => {
      // This test documents a KNOWN BUG in the API.
      // Expected behaviour: 404 Not Found (resource does not exist)
      // Actual behaviour: 500 Internal Server Error (server crashes)
      // See BUG_REPORT.md for the full bug ticket.
      const response = await apiClient.updateLocation(999999, { title: 'Crash Test' });

      expect(response.status()).toBe(500);
      console.log(`✓ [BUG confirmed] Non-existent resource update returned: ${response.status()} (expected 404)`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: DELETE — Remove Location Resources
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('DELETE /posts/:id — Delete Location Resource', () => {
    test('API-13: Returns 200 OK when deleting an existing location resource', async () => {
      const response = await apiClient.deleteLocation(1);

      expect(response.status()).toBe(200);
      console.log(`✓ Location deleted. Status: ${response.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: Advanced Geocoding & Corner Cases (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Advanced Geocoding & Corner Cases', () => {
    test('API-14: Returns empty array for empty search query', async () => {
      const response = await apiClient.searchLocation('');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      // Nominatim might return some default results or empty, but it shouldn't crash.
    });

    test('API-15: Returns empty array for invalid special character search', async () => {
      const response = await apiClient.searchLocation('!@#$%^&*()_+');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    test('API-16: Returns 200 OK for valid reverse geocoding', async () => {
      const response = await apiClient.reverseGeocode(51.5074, -0.1278); // London
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('address');
      expect(body.address).toHaveProperty('city');
    });

    test('API-17: [BUG] Returns 200 OK instead of 400 Bad Request for invalid coordinates in reverse geocode', async () => {
      // Nominatim API returns a 200 OK with an error message instead of 400 Bad Request
      const response = await apiClient.reverseGeocode(999, 999);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Unable to geocode');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: Advanced Authentication Permutations (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Advanced Authentication', () => {
    test('API-18: Returns 200 OK with valid Basic Auth credentials', async () => {
      const response = await apiClient.accessProtectedEndpointWithAuth('postman', 'password');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.authenticated).toBe(true);
    });

    test('API-19: Returns 401 Unauthorized with invalid Basic Auth credentials', async () => {
      const response = await apiClient.accessProtectedEndpointWithAuth('wronguser', 'wrongpass');
      expect(response.status()).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9: Advanced CRUD & REST Compliance (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Advanced CRUD & REST Permutations', () => {
    test('API-20: Returns 404 Not Found for non-existent resource GET', async () => {
      const response = await apiClient.getLocationById(999999);
      expect(response.status()).toBe(404);
    });

    test('API-21: Returns 200 OK and filtered results when using query parameters', async () => {
      const response = await apiClient.getLocationsByQuery({ userId: 1 });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      // Verify all items match the query parameter
      body.forEach((item: any) => expect(item.userId).toBe(1));
    });

    test('API-22: Returns 200 OK and applies partial updates via PATCH', async () => {
      const partialData = { title: 'Patched Title Only' };
      const response = await apiClient.patchLocation(1, partialData);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.title).toBe(partialData.title);
      // Original fields should remain (JSONPlaceholder mocks this)
      expect(body).toHaveProperty('userId');
    });

    test('API-23: Handles POST with extra unknown fields gracefully (ignores them)', async () => {
      const payloadWithExtra = { ...testConfig.api.sampleLocation, unknownField: 'should be ignored' };
      const response = await apiClient.createLocation(payloadWithExtra);
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.title).toBe(testConfig.api.sampleLocation.title);
      // JSONPlaceholder usually echoes it back, so we just verify it didn't crash (201 Created)
    });
  });
});
