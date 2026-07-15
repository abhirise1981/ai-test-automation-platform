import { test, expect } from '@playwright/test';

test.describe('REST API Location & Geocoding Tests', () => {
  const osmBaseUrl = 'https://nominatim.openstreetmap.org';
  const jsonplaceholderBaseUrl = 'https://jsonplaceholder.typicode.com';

  // Helper for setting User-Agent headers (Nominatim requires a valid User-Agent to avoid 403 Forbidden)
  const headers = {
    'User-Agent': 'ToptalSDETTestAutomationProject/1.0 (abhishek.kumar@test.com)'
  };

  test('GET - Retrieve coordinates for valid location (200 OK)', async ({ request }) => {
    const response = await request.get(`${osmBaseUrl}/search`, {
      headers,
      params: {
        q: 'London',
        format: 'json',
        limit: 1
      }
    });

    // Assert status code is 200
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    // Validate location schema and data
    const location = body[0];
    expect(location).toHaveProperty('lat');
    expect(location).toHaveProperty('lon');
    expect(location).toHaveProperty('display_name');

    console.log(`Retrieved location: ${location.display_name} (Lat: ${location.lat}, Lon: ${location.lon})`);
  });

  test('GET - Invalid params or format (400 Bad Request simulation or 404 Not Found)', async ({ request }) => {
    // Attempting to query an invalid endpoint or format
    const response = await request.get(`${osmBaseUrl}/invalid_endpoint_path_for_testing`, {
      headers
    });

    // Assert status code is 404 Not Found
    expect(response.status()).toBe(404);
    console.log(`Verified invalid endpoint returned status code: ${response.status()}`);
  });

  test('POST - Simulate creation of a location resource (201 Created)', async ({ request }) => {
    const locationData = {
      title: 'Central Park New York',
      body: 'Lat: 40.7829, Lon: -73.9654',
      userId: 1
    };

    const response = await request.post(`${jsonplaceholderBaseUrl}/posts`, {
      data: locationData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert status code is 201 Created
    expect(response.status()).toBe(201);

    const body = await response.json();

    // Validate the sent data matches
    expect(body.title).toBe(locationData.title);
    expect(body.body).toBe(locationData.body);
    expect(body.userId).toBe(locationData.userId);
    console.log(`Successfully simulated location creation for: ${body.title} (ID: ${body.id})`);
  });

  test('PUT - Simulate modification of location resource (200 OK)', async ({ request }) => {
    const updatedLocationData = {
      title: 'Central Park New York',
      body: 'Lat: 40.7850, Lon: -73.9680', // Modified slightly
      userId: 1
    };

    const response = await request.put(`${jsonplaceholderBaseUrl}/posts/1`, {
      data: updatedLocationData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert status code is 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.body).toBe(updatedLocationData.body);
    console.log(`Successfully simulated location modification for: ${body.title}`);
  });

  test('DELETE - Simulate deletion of location resource (200 OK)', async ({ request }) => {
    // JSONPlaceholder returns 200 OK for successful DELETE requests
    const response = await request.delete(`${jsonplaceholderBaseUrl}/posts/1`);

    // Assert status code is 200
    expect(response.status()).toBe(200);
    console.log(`Successfully simulated location deletion. Status code: ${response.status()}`);
  });

  test('PUT - Simulate Server Error on Invalid Resource (500 Internal Server Error)', async ({ request }) => {
    // Trying to update a resource ID that does not exist in the mock database causes a 500 crash
    const response = await request.put(`${jsonplaceholderBaseUrl}/posts/999999`, {
      data: { title: 'Crash Test' }
    });

    // Assert status code is 500
    expect(response.status()).toBe(500);
    console.log(`Verified error handling for non-existent PUT returned status code: ${response.status()}`);
  });

});
